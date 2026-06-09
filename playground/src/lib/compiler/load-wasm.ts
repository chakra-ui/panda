import init, * as wasmModule from '@pandacss/compiler-wasm/pkg-web/compiler_wasm.js'
import type { WasmModule } from '@pandacss/compiler-wasm/web'

let promise: Promise<WasmModule> | null = null

/**
 * Load + initialize the wasm engine once (browser). `init()` with no argument
 * resolves the `.wasm` via `new URL('…', import.meta.url)` inside the pkg-web
 * glue, which webpack emits and serves — no manual copy to `public/`.
 */
export function loadWasm(): Promise<WasmModule> {
  if (!promise) {
    promise = init().then(() => {
      wasmModule.installPanicHook?.()
      return wasmModule as unknown as WasmModule
    })
  }
  return promise
}
