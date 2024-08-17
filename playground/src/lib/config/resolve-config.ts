import type { Config, Preset } from '@pandacss/types'
import { mergeConfigs } from '@pandacss/config/merge'
import { validateConfig } from '../../../../packages/config/src/validate-config'
import { logger } from '@pandacss/logger'

type Extendable<T> = T & { extend?: T }
type ExtendableConfig = Extendable<Config>

export function resolveConfig(config?: Config) {
  if (!config) return

  const presets = new Set<any>()

  if (config.presets) {
    config.presets.forEach((preset: any) => {
      presets.add(preset)
    })
  }

  presets.add(playgroundPreset)

  config.presets = Array.from(presets)

  const mergedConfig = getResolvedConfig(config)

  if (!mergedConfig) return

  if (mergedConfig.logLevel) {
    logger.level = mergedConfig.logLevel
  }

  validateConfig(mergedConfig as any)

  // No config:resolved hook, cause we can't resolve async here

  return mergedConfig
}

/**
 * Recursively merge all presets into a single config
 * PLayground won't be able to handle bundling presets
 */
function getResolvedConfig(config: ExtendableConfig) {
  const stack: ExtendableConfig[] = [config]
  const configs: ExtendableConfig[] = []

  while (stack.length > 0) {
    const current = stack.pop()!

    if (!isPlaygroundPreset(current as Preset)) {
      console.error(`Invalid preset: ${current}`)
      return
    }

    const subPresets = current.presets ?? []
    for (const subPreset of subPresets) {
      // Only handle object presets
      if (typeof subPreset === 'object' && !(subPreset instanceof Promise)) {
        stack.push(subPreset)
      }
    }

    configs.unshift(current)
  }

  const merged = mergeConfigs(configs) as Config

  // Keep the resolved presets so we can find the origin of a token
  merged.presets = configs.slice(0, -1) as Preset[]

  return merged
}

function isPlaygroundPreset(preset: string | Preset | Promise<Preset>): preset is Preset | Promise<Preset> {
  return typeof preset !== 'string'
}

const playgroundPreset: Preset = {
  name: 'playground-preset',
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

          '& pre': {
            whiteSpace: 'pre-wrap',
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
