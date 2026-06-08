/**
 * `@pandacss/compiler-wasm/web` — browser-only facade.
 *
 * Exports only the wasm-module facade (`createCompilerFromWasmModule`) and the
 * types/helpers that go with it. Has **no** `import('../pkg-node/...')` in its
 * module graph, so tsup injects no Node `fileURLToPath` shim into the browser
 * bundle.
 *
 * Browser consumers:
 *
 * ```ts
 * import initWasm, * as wasmMod from '@pandacss/compiler-wasm/pkg-web/compiler_wasm.js'
 * import { createCompilerFromWasmModule } from '@pandacss/compiler-wasm/web'
 *
 * await initWasm(new URL('/compiler_wasm_bg.wasm', window.location.origin))
 * const compiler = createCompilerFromWasmModule(wasmMod, config, options)
 * ```
 */

import {
  assertProjectCallbacks,
  getTokenCategoryValues,
  makeBuildInfoApi,
  mergeCallbacks,
} from '@pandacss/compiler-shared'
import type {
  BuildInfoNative,
  Compiler,
  CompilerOptions,
  ProjectCallbacks,
  SerializedConfig,
} from '@pandacss/compiler-shared'
import { registerCallbacks } from './callbacks'
import type { TokenDictionaryInput, WasmCompiler, WasmFileSystem } from './types'

export type { PatternHelpers } from './callbacks'
export type {
  MatcherInput,
  MatchersInput,
  TokenDictionaryInput,
  WasmCompiler,
  WasmExtractor,
  WasmFileSystem,
} from './types'
// Re-export the shared contract so consumers get one import surface.
export type * from '@pandacss/compiler-shared'

/** `configCallbacks` carry construction-time `utility.values` resolvers. */
interface WasmFromConfigOptions {
  configCallbacks?: {
    utilityValues?: Record<string, (tokenDictionary: TokenDictionaryInput | undefined) => unknown>
  }
}

/** The raw wasm instance — superset of {@link Compiler} carrying the internal
 *  `token_dictionary` the facade hides. */
interface RawWasmCompiler extends WasmCompiler {
  token_dictionary?(): TokenDictionaryInput | undefined
}

export interface WasmModule {
  WasmFileSystem: new () => WasmFileSystem
  WasmExtractor: new (fs: WasmFileSystem, matchers: unknown) => unknown
  WasmCompiler: {
    fromConfig(fs: WasmFileSystem, config: SerializedConfig, options?: WasmFromConfigOptions): RawWasmCompiler
  }
  installPanicHook: () => void
}

/**
 * Build a compiler from an already-loaded wasm module. Browser callers that
 * import `./pkg-web/compiler_wasm.js` should call its default `init()` first,
 * then pass the initialized module here.
 */
export function createCompilerFromWasmModule(
  mod: WasmModule,
  config: SerializedConfig,
  options?: CompilerOptions,
): Compiler {
  return build(mod, config, options?.callbacks ?? {})
}

export function build(mod: WasmModule, config: SerializedConfig, callbacks: ProjectCallbacks): Compiler {
  const fs = new mod.WasmFileSystem()
  assertProjectCallbacks(config, callbacks)

  const compiler = mod.WasmCompiler.fromConfig(fs, config, buildFromConfigOptions(callbacks))
  registerCallbacks(compiler, callbacks, compiler.token_dictionary?.())

  // Expose the shared FS as a field so the return shape matches native.
  ;(compiler as unknown as { fs: WasmFileSystem }).fs = fs

  // Wire the ergonomic `compiler.buildInfo` namespace over the wasm primitives,
  // mirroring the native binding. Non-enumerable so it stays off snapshots.
  Object.defineProperty(compiler, 'buildInfo', {
    value: makeBuildInfoApi(compiler as unknown as BuildInfoNative),
    enumerable: false,
  })

  return compiler as unknown as Compiler
}

export function buildFromConfigOptions(callbacks: ProjectCallbacks): WasmFromConfigOptions | undefined {
  const utilityValues = callbacks['utility.values']
  if (!utilityValues || Object.keys(utilityValues).length === 0) return undefined

  return {
    configCallbacks: {
      utilityValues: Object.fromEntries(
        Object.entries(utilityValues).map(([id, callback]) => [
          id,
          (tokenDictionary: TokenDictionaryInput | undefined) =>
            callback((category: string) => getTokenCategoryValues(category, tokenDictionary)),
        ]),
      ),
    },
  }
}

export { mergeCallbacks }
