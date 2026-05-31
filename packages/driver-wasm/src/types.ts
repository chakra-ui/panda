import type { ConfigSnapshot } from '@pandacss/compiler-shared'
import type { WasmModule } from '@pandacss/compiler-wasm'

export interface BrowserDriverOptions {
  /** Pre-built config snapshot (no in-browser bundling — Rolldown is Node-only). */
  snapshot: ConfigSnapshot
  /** Source files to stage into the in-memory fs before the first `scan`. */
  sources?: Record<string, string>
  /**
   * An initialized `pkg-web` wasm module — the browser path: the caller does
   * `import init, * as mod from '@pandacss/compiler-wasm/pkg-web/compiler_wasm.js'; await init()`
   * and passes `mod` here. Omit in Node/SSR/tests to load the bundled `pkg-node`
   * artifact via `loadWasm`.
   */
  module?: WasmModule
}
