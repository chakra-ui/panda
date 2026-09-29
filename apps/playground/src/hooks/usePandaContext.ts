import { createPlaygroundCompiler } from '@/src/lib/compiler/create-compiler'
import { resolveConfig } from '@/src/lib/config/resolve-config'
import type { Compiler, WasmModule } from '@pandacss/compiler-wasm/web'
import { Config, StaticCssOptions, UserConfig } from '@pandacss/types'
import { merge } from 'merge-anything'
import { useMemo, useRef } from 'react'

export interface PandaContext {
  /** `null` until the wasm engine has loaded. */
  compiler: Compiler | null
  /** Resolved config (presets merged) — drives breakpoints, introspection. */
  config: UserConfig | null
  error?: unknown
}

const baseOverrides = {
  cwd: '',
  include: [] as string[],
  outdir: 'styled-system',
  preflight: true,
}

/**
 * Build a wasm-backed compiler from the user's config. Stable across source
 * keystrokes — only rebuilds when `userConfig` (the config tab) or the loaded
 * wasm `module` changes. On a config error it keeps the previous compiler so the
 * preview doesn't blank out.
 */
export const usePandaContext = (mod: WasmModule | null, userConfig: Config | null): PandaContext => {
  const previous = useRef<PandaContext | null>(null)

  return useMemo(() => {
    if (!mod) return previous.current ?? { compiler: null, config: null }

    let config: UserConfig | undefined
    try {
      config = resolveConfig({
        ...baseOverrides,
        ...userConfig,
        staticCss: merge(userConfig?.staticCss, {
          recipes: { playgroundError: ['*'] } as StaticCssOptions['recipes'],
        }),
        jsxFramework: userConfig?.jsxFramework ? 'react' : undefined,
      }) as UserConfig
    } catch (error) {
      const ctx = previous.current ?? { compiler: null, config: null }
      return { ...ctx, error }
    }

    try {
      const compiler = createPlaygroundCompiler(mod, config)
      const ctx: PandaContext = { compiler, config }
      previous.current = ctx
      return ctx
    } catch (error) {
      return previous.current ? { ...previous.current, error } : { compiler: null, config: config ?? null, error }
    }
  }, [mod, userConfig])
}
