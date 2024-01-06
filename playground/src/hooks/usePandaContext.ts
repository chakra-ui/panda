import { Config, StaticCssOptions } from '@pandacss/types'
import { useRef } from 'react'
import { Generator } from '@pandacss/generator'
import { merge } from 'merge-anything'
import { createHooks } from 'hookable'
import { getResolvedConfig, resolveConfig } from '@/src/lib/config/resolve-config'

export const usePandaContext = (_config: Config | null) => {
  const previousContext = useRef<Generator | null>(null)

  const config = getResolvedConfig(
    resolveConfig({
      cwd: '',
      include: [],
      outdir: 'styled-system',
      preflight: true,
      optimize: true,
      ..._config,
      staticCss: merge(_config?.staticCss, {
        recipes: { playgroundError: ['*'] } as StaticCssOptions['recipes'],
      }),

      jsxFramework: _config?.jsxFramework ? 'react' : undefined,
    }),
  )

  try {
    // in event of error (invalid token format), use previous generator
    const context = new Generator({
      dependencies: [],
      serialized: '',
      deserialize: () => config!,
      path: '',
      hooks: createHooks(),
      config: config as any,
    })
    previousContext.current = context
    return context
  } catch {
    return previousContext.current!
  }
}
