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
  staticCss: { recipes: { playgroundError: ['*'] } as StaticCssOptions['recipes'] },
  jsxFramework: undefined,
})!

export const usePandaContext = (userConfig: Config | null): Generator & { error?: unknown } => {
  const previousContext = useRef<(Generator & { error?: unknown }) | null>(null)

  const getDefaultContext = () =>
    new Generator({
      dependencies: [],
      serialized: '',
      deserialize: () => defaultConfig,
      path: '',
      hooks: {},
      config: defaultConfig as UserConfig,
    })

  let config
  let error: unknown

  try {
    config = resolveConfig({
      cwd: '',
      include: [],
      outdir: 'styled-system',
      preflight: true,
      ...userConfig,
      staticCss: merge(userConfig?.staticCss, {
        recipes: { playgroundError: ['*'] } as StaticCssOptions['recipes'],
      }),

      jsxFramework: userConfig?.jsxFramework ? 'react' : undefined,
    })
  } catch (e) {
    config = defaultConfig
    error = e
  }

  if (error) {
    // Return stable reference when there's an error to prevent cursor jumps
    const ctx = (previousContext.current ?? getDefaultContext()) as Generator & { error?: unknown }
    ctx.error = error
    return ctx
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
    previousContext.current = getDefaultContext()

    return getDefaultContext()
  }
}
