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
  WasmProjectOptions,
} from './types'

export type {
  Atom,
  FileReport,
  MatcherInput,
  MatchersInput,
  ProjectSummary,
  RecipeEntry,
  TokenDictionaryInput,
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
  WasmProject: new (fs: WasmFileSystem, matchers: unknown, options?: WasmProjectOptions) => WasmProject
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
  const project = new P(fs, matchers as unknown, options)
  return { fs, project }
}
