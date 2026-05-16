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

import type { WasmExtractor as WasmExtractorClass, WasmFileSystem as WasmFileSystemClass } from './types'

export type { MatchersInput, MatcherInput, TokenDictionaryInput } from './types'
export type WasmFileSystem = WasmFileSystemClass
export type WasmExtractor = WasmExtractorClass

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
export async function loadWasm(): Promise<{
  WasmFileSystem: new () => WasmFileSystem
  WasmExtractor: new (fs: WasmFileSystem, matchers: unknown) => WasmExtractor
  installPanicHook: () => void
}> {
  if (cached) return cached
  // pkg-node ships CommonJS that auto-initializes the wasm module on require.
  const mod = (await import('../pkg-node/binding_wasm.js')) as any
  cached = mod
  if (typeof mod.installPanicHook === 'function') {
    mod.installPanicHook()
  }
  return mod
}

let cached: {
  WasmFileSystem: new () => WasmFileSystem
  WasmExtractor: new (fs: WasmFileSystem, matchers: unknown) => WasmExtractor
  installPanicHook: () => void
} | null = null

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
