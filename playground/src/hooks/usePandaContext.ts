import { Config, Preset, StaticCssOptions } from '@pandacss/types'
import { useRef } from 'react'
import { Generator } from '@pandacss/generator'
import { merge } from 'merge-anything'
import presetBase from '@pandacss/preset-base'
import presetTheme from '@pandacss/preset-panda'
import { createHooks } from 'hookable'
import { getResolvedConfig } from '@/src/lib/config/resolve-config'

export const usePandaContext = (_config: Config | null) => {
  const previousContext = useRef<Generator | null>(null)

  const { presets, ...restConfig } = _config ?? {}

  const config = getResolvedConfig({
    cwd: '',
    include: [],
    outdir: 'styled-system',
    preflight: true,
    optimize: true,
    presets: [presetBase, presetTheme, playgroundPreset, ...(presets ?? [])],
    ...restConfig,
    staticCss: merge(restConfig.staticCss, {
      recipes: { playgroundError: ['*'] } as StaticCssOptions['recipes'],
    }),

    jsxFramework: restConfig.jsxFramework ? 'react' : undefined,
  })

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

const playgroundPreset: Preset = {
  theme: {
    recipes: {
      playgroundError: {
        className: 'playgroundError',
        base: {
          p: '2',
          color: 'red.400',
          display: 'flex',
          gap: '2',
          alignItems: 'center',
          background: { base: 'white', _dark: '#262626' },
          borderBottomWidth: '1px',
          borderBottomColor: { base: 'gray.100', _dark: '#262626' },
          textStyle: 'sm',

          '& > span': {
            borderRadius: 'full',
            display: 'flex',
            padding: '1',
            alignItems: 'center',
            background: {
              base: 'rgba(235, 94, 66, 0.2)',
              _dark: 'rgba(235, 94, 66, 0.1)',
            },
          },

          '& svg': {
            h: '16px',
            w: '16px',
          },
        },
        variants: {
          style: {
            empty: {},
          },
        },
      },
    },
  },
}
