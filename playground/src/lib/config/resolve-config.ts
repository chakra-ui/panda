import type { Config, Preset } from '@pandacss/types'
import { mergeConfigs } from '@pandacss/config/merge'
import presetBase from '@pandacss/preset-base'
import presetPanda from '@pandacss/preset-panda'

type Extendable<T> = T & { extend?: T }
type ExtendableConfig = Extendable<Config>

export function resolveConfig(config?: Config) {
  if (!config) return

  const presets = new Set<any>()

  if (!config.eject) {
    presets.add(presetBase)
  }

  if (config.presets) {
    config.presets.forEach((preset: any) => {
      presets.add(preset)
    })
  } else if (!config.eject) {
    presets.add(presetPanda)
  }

  presets.add(playgroundPreset)

  config.presets = Array.from(presets)

  return config
}

/**
 * Recursively merge all presets into a single config
 * PLayground won't be able to handle bundling presets
 */
export function getResolvedConfig(config?: ExtendableConfig) {
  if (!config) return
  const presets = config.presets ?? []

  const configs: ExtendableConfig[] = []
  while (presets.length > 0) {
    const preset = presets.shift()!

    if (!isPlaygroundPreset(preset)) {
      console.error(`Invalid preset: ${preset}`)
      return
    }

    if (preset instanceof Promise) {
      preset.then((result) => {
        configs.unshift(result)
        presets.unshift(...(result.presets ?? []))
      })
    } else {
      configs.unshift(preset)
      presets.unshift(...(preset.presets ?? []))
    }
  }

  configs.unshift(config)
  return mergeConfigs(configs) as Config
}

function isPlaygroundPreset(preset: string | Preset | Promise<Preset>): preset is Preset | Promise<Preset> {
  return typeof preset !== 'string'
}

const playgroundPreset: Preset = {
  theme: {
    recipes: {
      playgroundError: {
        className: 'playgroundError',
        base: {
          p: '2',
          color: '#f87171',
          display: 'flex',
          gap: '2',
          alignItems: 'center',
          background: { base: 'white', _dark: '#262626' },
          borderBottomWidth: '1px',
          borderBottomColor: { base: '#f3f4f6', _dark: '#262626' },
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
