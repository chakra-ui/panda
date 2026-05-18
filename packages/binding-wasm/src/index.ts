/**
 * `@pandacss/binding-wasm` — WebAssembly binding for the Panda Rust engine.
 *
 * Two output targets are bundled:
 * - `./pkg-node/*` — CommonJS, for Node / Vitest / SSR.
 * - `./pkg-web/*` — ESM with `fetch`-based init, for browser playgrounds.
 *
 * Consumers in Node should `import { createExtractor } from '@pandacss/binding-wasm'`.
 * Browser consumers should call `init()` first (returns a promise), then construct
 * a `WasmFileSystem` + `WasmExtractor`.
 */

import type {
  WasmExtractor as WasmExtractorClass,
  WasmFileSystem as WasmFileSystemClass,
  WasmProject as WasmProjectClass,
  WasmProjectCallbackKind,
  WasmProjectCallbacks,
  WasmProjectOptions,
  WasmConfigSnapshot,
} from './types'
import {
  assertProjectCallbacks,
  registerProjectCallbacks,
  resolveUtilityValueCallbacks,
  wrapProjectCallbacks,
} from './project-callbacks'

export type {
  Atom,
  FileReport,
  MatcherInput,
  MatchersInput,
  ProjectSummary,
  RecipeEntry,
  TokenDictionaryInput,
  WasmConfigSnapshot,
  WasmProjectCallbacks,
  WasmProjectOptions,
} from './types'
export type WasmFileSystem = WasmFileSystemClass
export type WasmExtractor = WasmExtractorClass
export type WasmProject = WasmProjectClass

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

export interface Diagnostic {
  message: string
  severity: 'error' | 'warning'
  span?: { start: number; end: number }
  location?: {
    start: { line: number; column: number }
    end: { line: number; column: number }
  }
}

export interface ExtractUsage {
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
interface WasmModule {
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
  const mod = (await import('../pkg-node/binding_wasm.js')) as any
  cached = mod
  if (typeof mod.installPanicHook === 'function') {
    mod.installPanicHook()
  }
  return mod
}

let cached: WasmModule | null = null

/**
 * Convenience factory: load wasm, create an FS, create an extractor.
 * Most Node-side callers want this; advanced callers can call `loadWasm()`
 * and construct the classes themselves.
 */
export async function createExtractor(matchers: import('./types').MatchersInput): Promise<{
  fs: WasmFileSystem
  extractor: WasmExtractor
}> {
  const { WasmFileSystem: FS, WasmExtractor: EX } = await loadWasm()
  const fs = new FS()
  const extractor = new EX(fs, matchers as unknown)
  return { fs, extractor }
}

/**
 * Convenience factory for the stateful `WasmProject`. Holds a per-file
 * atom registry; cross-file resolution shares the returned FS handle.
 */
export async function createProject(
  matchers: import('./types').MatchersInput,
  options?: WasmProjectOptions,
): Promise<{ fs: WasmFileSystem; project: WasmProject }> {
  const { WasmFileSystem: FS, WasmProject: P } = await loadWasm()
  const fs = new FS()
  const nativeOptions = stripProjectCallbacks(options)
  const callbacks = options?.callbacks ?? {}
  if (options?.config) assertProjectCallbacks(options.config, callbacks)
  const config = options?.config
    ? resolveUtilityValueCallbacks(options.config, callbacks, options?.tokenDictionary ?? matchers.tokenDictionary)
    : undefined
  const project = new P(fs, matchers as unknown, nativeOptions)
  registerProjectCallbacks(project, callbacks)
  return {
    fs,
    project: wrapProjectCallbacks(project, {
      ...options,
      config,
      callbacks,
      tokenDictionary: options?.tokenDictionary ?? matchers.tokenDictionary,
    }),
  }
}

/**
 * Convenience factory for config-derived projects. This mirrors
 * `@pandacss/binding`'s `Project.fromConfig` path so callers don't have to
 * construct matchers by hand.
 */
export async function createProjectFromConfig(
  configOrSnapshot: Record<string, unknown> | WasmConfigSnapshot,
  options?: WasmProjectOptions,
): Promise<{ fs: WasmFileSystem; project: WasmProject }> {
  const { WasmFileSystem: FS, WasmProject: P } = await loadWasm()
  const fs = new FS()
  const { config, callbacks } = normalizeProjectConfigInput(configOrSnapshot, options)
  const nativeOptions = stripProjectCallbacks(options)
  assertProjectCallbacks(config, callbacks)
  const resolvedConfig = resolveUtilityValueCallbacks(config, callbacks, nativeOptions?.tokenDictionary)
  const project = P.fromConfig(fs, resolvedConfig, nativeOptions)
  registerProjectCallbacks(project, callbacks)
  return { fs, project: wrapProjectCallbacks(project, { ...options, config: resolvedConfig, callbacks }) }
}

function stripProjectCallbacks(options: WasmProjectOptions | undefined): WasmProjectOptions | undefined {
  if (!options) return undefined
  const { callbacks: _callbacks, config: _config, ...rest } = options
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
