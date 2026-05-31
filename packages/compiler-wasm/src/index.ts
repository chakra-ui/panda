/**
 * `@pandacss/compiler-wasm` — WebAssembly binding for the Panda Rust engine.
 *
 * Two output targets are bundled:
 * - `./pkg-node/*` — CommonJS, for Node / Vitest / SSR.
 * - `./pkg-web/*` — ESM with `fetch`-based init, for browser playgrounds.
 *
 * Consumers should `import { createCompiler } from '@pandacss/compiler-wasm'`.
 * It loads the wasm module and resolves to a `Compiler` — the same flat shape
 * as the native binding, with the shared in-memory FS exposed as `compiler.fs`.
 */

import { assertProjectCallbacks, getTokenCategoryValues, mergeCallbacks } from '@pandacss/compiler-shared'
import type {
  Compiler,
  CompilerOptions,
  ConfigSnapshot,
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

export { createBrowserDriver } from './driver'
export type { BrowserDriverOptions } from './driver'

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

let cached: WasmModule | null = null

/**
 * Load the Node-targeted wasm module. Idempotent — a single shared binding
 * handle is cached after first call. Browser consumers should import
 * `./pkg-web/*` directly and call its `init()`.
 */
export async function loadWasm(): Promise<WasmModule> {
  if (cached) return cached
  // pkg-node ships CommonJS that auto-initializes the wasm module on require.
  const mod = (await import('../pkg-node/compiler_wasm.js')) as any
  cached = mod
  if (typeof mod.installPanicHook === 'function') {
    mod.installPanicHook()
  }
  return mod
}

/**
 * Build a compiler from a resolved, JSON-safe Panda config. Resolves to a
 * `Compiler` whose `fs` is the shared in-memory filesystem — populate it
 * (`compiler.fs.addFile(...)`) so cross-file imports fold during extraction.
 */
export async function createCompiler(config: SerializedConfig, options?: CompilerOptions): Promise<Compiler> {
  return createCompilerFromWasmModule(await loadWasm(), config, options)
}

/** Like {@link createCompiler}, but takes a `{ config, callbacks }` snapshot.
 *  Snapshot callbacks merge under any passed in `options.callbacks`. */
export async function createCompilerFromSnapshot(
  snapshot: ConfigSnapshot,
  options?: CompilerOptions,
): Promise<Compiler> {
  const callbacks = mergeCallbacks(snapshot.callbacks, options?.callbacks)
  return build(await loadWasm(), snapshot.config, callbacks)
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

function build(mod: WasmModule, config: SerializedConfig, callbacks: ProjectCallbacks): Compiler {
  const fs = new mod.WasmFileSystem()
  assertProjectCallbacks(config, callbacks)
  const compiler = mod.WasmCompiler.fromConfig(fs, config, buildFromConfigOptions(callbacks))
  registerCallbacks(compiler, callbacks, compiler.token_dictionary?.())
  // Expose the shared FS as a field so the return shape matches native.
  ;(compiler as unknown as { fs: WasmFileSystem }).fs = fs
  return compiler as unknown as Compiler
}

function buildFromConfigOptions(callbacks: ProjectCallbacks): WasmFromConfigOptions | undefined {
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
