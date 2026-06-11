import { createCompilerFromWasmModule } from '@pandacss/compiler-wasm/web'
import type { Compiler, WasmModule } from '@pandacss/compiler-wasm/web'
import { createConfigSnapshot } from '@pandacss/config/serialize'
import type { UserConfig } from '@pandacss/types'

/**
 * Build a wasm {@link Compiler} from a resolved playground config. The config is
 * lowered to a JSON-safe snapshot (functions → callback refs) in-browser; no
 * Rolldown bundling (that's Node-only).
 */
export function createPlaygroundCompiler(mod: WasmModule, config: UserConfig): Compiler {
  const snapshot = createConfigSnapshot(config)
  // `js` format → `.js` runtime + `.d.ts` types, which Monaco resolves natively
  // and the preview can eval as ESM.
  const serializedConfig = { ...snapshot.config, codegenFormat: 'js' as const }
  return createCompilerFromWasmModule(mod, serializedConfig, {
    callbacks: snapshot.callbacks,
    hooks: snapshot.hooks,
  })
}
