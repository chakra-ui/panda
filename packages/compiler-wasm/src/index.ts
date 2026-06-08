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
 *
 * Browser consumers that want a shim-free bundle should import from
 * `@pandacss/compiler-wasm/web` instead — it carries only the wasm-module
 * facade with no `pkg-node` / `loadWasm` in its module graph.
 */

import { mergeCallbacks, mergeHooks } from '@pandacss/compiler-shared'
import type { Compiler, CompilerOptions, ConfigSnapshot, SerializedConfig } from '@pandacss/compiler-shared'
import { build } from './web'
import type { WasmModule } from './web'

// Re-export everything from the browser-safe web entry so the main entry's
// public API surface stays identical.
export * from './web'
export type * from './web'

export { createBrowserDriver } from './driver'
export type { BrowserDriverOptions } from './driver'

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
  const { createCompilerFromWasmModule } = await import('./web')
  return createCompilerFromWasmModule(await loadWasm(), config, options)
}

/** Like {@link createCompiler}, but takes a `{ config, callbacks }` snapshot.
 *  Snapshot callbacks merge under any passed in `options.callbacks`. */
export async function createCompilerFromSnapshot(
  snapshot: ConfigSnapshot,
  options?: CompilerOptions,
): Promise<Compiler> {
  const callbacks = mergeCallbacks(snapshot.callbacks, options?.callbacks)
  const hooks = mergeHooks(snapshot.hooks, options?.hooks)
  return build(await loadWasm(), snapshot.config, callbacks, hooks)
}
