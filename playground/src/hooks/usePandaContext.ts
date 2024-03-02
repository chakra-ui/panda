import { Config, StaticCssOptions, UserConfig } from '@pandacss/types'
import { useRef } from 'react'
import { Generator } from '@pandacss/generator'
import { merge } from 'merge-anything'
import { resolveConfig } from '@/src/lib/config/resolve-config'

const defaultConfig = resolveConfig({
  cwd: '',
  include: [],
  outdir: 'styled-system',
  preflight: true,
  optimize: true,
  staticCss: { recipes: { playgroundError: ['*'] } as StaticCssOptions['recipes'] },
  jsxFramework: undefined,
})!

export const usePandaContext = (userConfig: Config | null) => {
  const previousContext = useRef<Generator | null>(null)

  let config

  try {
    config = resolveConfig({
      cwd: '',
      include: [],
      outdir: 'styled-system',
      preflight: true,
      optimize: true,
      ...userConfig,
      staticCss: merge(userConfig?.staticCss, {
        recipes: { playgroundError: ['*'] } as StaticCssOptions['recipes'],
      }),

      jsxFramework: userConfig?.jsxFramework ? 'react' : undefined,
    })
  } catch (error) {
    config = defaultConfig
    console.log(error)
  }

  try {
    // in event of error (invalid token format), use previous generator
    const context = new Generator({
      dependencies: [],
      serialized: '',
      deserialize: () => config!,
      path: '',
      hooks: config?.hooks ?? {},
      config: config as any,
    })
    previousContext.current = context
    return context
  } catch {
    if (previousContext.current) {
      return previousContext.current!
    }

    // or use default config cause we always need a context

    const context = new Generator({
      dependencies: [],
      serialized: '',
      deserialize: () => defaultConfig,
      path: '',
      hooks: {},
      config: defaultConfig as UserConfig,
    })
    previousContext.current = context
    return context
  }
}
