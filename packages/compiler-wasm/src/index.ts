/**
 * `@pandacss/compiler-wasm` — WebAssembly binding for the Panda Rust engine.
 *
 * Two output targets are bundled:
 * - `./pkg-node/*` — CommonJS, for Node / Vitest / SSR.
 * - `./pkg-web/*` — ESM with `fetch`-based init, for browser playgrounds.
 *
 * Consumers should `import { createCompiler } from '@pandacss/compiler-wasm'`.
 * It loads the wasm module, returns `{ fs, compiler }`, and the compiler
 * exposes `extract` / `parseFile` / `atoms` / … just like the native binding.
 */

import type {
  Diagnostic,
  WasmExtractor as WasmExtractorClass,
  WasmFileSystem as WasmFileSystemClass,
  WasmProject as WasmProjectClass,
  WasmProjectCallbackKind,
  WasmProjectCallbacks,
  WasmProjectOptions,
  WasmConfigSnapshot,
} from './types'
import { assertProjectCallbacks, registerCallbacks, resolveUtilityValueCallbacks } from './callbacks'
export type { PatternHelpers } from './callbacks'

export type {
  Atom,
  CompileFileManifest,
  CompileLayerRange,
  CompileLayerRanges,
  CompileManifest,
  CompileOutput,
  Diagnostic,
  ParseFileReport,
  ParsedFileView,
  MatcherInput,
  MatchersInput,
  ProjectSummary,
  RecipeEntry,
  StaticPatternResult,
  TokenDictionaryInput,
  WasmConfigSnapshot,
  WasmProjectCallbacks,
  WasmProjectOptions,
} from './types'
export type WasmFileSystem = WasmFileSystemClass
export type WasmExtractor = WasmExtractorClass
export type WasmProject = WasmProjectClass
export type WasmCompiler = WasmProjectClass
export type CompilerOptions = WasmProjectOptions

export interface GlobOptions {
  include: string[]
  exclude?: string[]
  cwd?: string
  absolute?: boolean
}

export interface ExtractedCall {
  category: 'css' | 'recipe' | 'pattern' | 'jsx' | 'tokens'
  name: string
  alias: string
  data: Array<unknown | null>
  span: { start: number; end: number }
}

export interface ExtractedJsx {
  category: 'css' | 'recipe' | 'pattern' | 'jsx' | 'tokens'
  name: string
  alias: string
  data: unknown
  span: { start: number; end: number }
}

export interface ExtractResult {
  calls: ExtractedCall[]
  jsx: ExtractedJsx[]
  diagnostics: Diagnostic[]
}

/**
 * Load the Node-targeted wasm module. Idempotent — a single shared
 * binding handle is cached after first call.
 *
 * Node consumers (Vitest, SSR) should prefer this entrypoint. For
 * browser, use the `./pkg-web/*` exports directly with `init()`.
 */
export interface WasmModule {
  WasmFileSystem: new () => WasmFileSystem
  WasmExtractor: new (fs: WasmFileSystem, matchers: unknown) => WasmExtractor
  WasmProject: {
    new (fs: WasmFileSystem, matchers: unknown, options?: WasmProjectOptions): WasmProject
    fromConfig(fs: WasmFileSystem, config: Record<string, unknown>, options?: WasmProjectOptions): WasmProject
  }
  installPanicHook: () => void
}

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

let cached: WasmModule | null = null

/**
 * Build a compiler from a config (or `WasmConfigSnapshot`). Returns the shared
 * `WasmFileSystem` too — populate it (`fs.addFile(...)`) so cross-file imports
 * fold during extraction.
 */
export async function createCompiler(
  configOrSnapshot: Record<string, unknown> | WasmConfigSnapshot,
  options?: CompilerOptions,
): Promise<{ fs: WasmFileSystem; compiler: WasmCompiler }> {
  return createCompilerFromWasmModule(await loadWasm(), configOrSnapshot, options)
}

/**
 * Build a compiler from an already-loaded wasm module. Browser callers that
 * import `./pkg-web/compiler_wasm.js` should call its default `init()` first,
 * then pass the initialized module here so host callbacks are registered
 * before `parseFile()` encodes pattern usage.
 */
export function createCompilerFromWasmModule(
  mod: WasmModule,
  configOrSnapshot: Record<string, unknown> | WasmConfigSnapshot,
  options?: CompilerOptions,
): { fs: WasmFileSystem; compiler: WasmCompiler } {
  const { WasmFileSystem: FS, WasmProject: P } = mod
  const fs = new FS()
  const { config, callbacks } = normalizeProjectConfigInput(configOrSnapshot, options)
  const nativeOptions = stripProjectCallbacks(options)
  assertProjectCallbacks(config, callbacks)
  const resolvedConfig = resolveUtilityValueCallbacks(config, callbacks, options?.tokenDictionary)
  const compiler = P.fromConfig(fs, resolvedConfig, nativeOptions)
  registerCallbacks(compiler, callbacks, options?.tokenDictionary)
  return { fs, compiler }
}

function stripProjectCallbacks(options: WasmProjectOptions | undefined): WasmProjectOptions | undefined {
  if (!options) return undefined
  const { callbacks: _callbacks, tokenDictionary: _tokenDictionary, ...rest } = options
  return rest
}

function normalizeProjectConfigInput(
  input: Record<string, unknown> | WasmConfigSnapshot,
  options?: WasmProjectOptions,
): { config: Record<string, unknown>; callbacks: WasmProjectCallbacks } {
  if (isConfigSnapshot(input)) {
    return {
      config: input.config,
      callbacks: mergeCallbacks(input.callbacks, options?.callbacks),
    }
  }
  return {
    config: input,
    callbacks: options?.callbacks ?? {},
  }
}

function isConfigSnapshot(value: Record<string, unknown> | WasmConfigSnapshot): value is WasmConfigSnapshot {
  return (
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    'config' in value &&
    !!(value as WasmConfigSnapshot).config &&
    typeof (value as WasmConfigSnapshot).config === 'object' &&
    !Array.isArray((value as WasmConfigSnapshot).config)
  )
}

function mergeCallbacks(...items: Array<WasmProjectCallbacks | undefined>): WasmProjectCallbacks {
  const result: WasmProjectCallbacks = {}
  for (const item of items) {
    for (const [kind, callbacks] of Object.entries(item ?? {}) as Array<
      [WasmProjectCallbackKind, Record<string, Function>]
    >) {
      result[kind] = { ...result[kind], ...callbacks } as Record<string, (...args: any[]) => unknown>
    }
  }
  return result
}
