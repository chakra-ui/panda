import type { Config, Preset } from '@pandacss/types'
import { mergeConfigs } from '@pandacss/config/merge'
import { bundledPresets } from '@/src/lib/config/bundled-presets'

type Extendable<T> = T & { extend?: T }
type ExtendableConfig = Extendable<Config>

// v2 does not auto-inject preset-base/preset-panda — presets are explicit
// (design-notes/config-loading-design.md), which is why `eject` was dropped (30b2f411d).
// The playground matches that: it resolves the *declared* presets (built-ins by name →
// bundled objects, others already resolved upstream by compile.ts) and never injects.
export function resolveConfig(config?: Config) {
  if (!config) return

  const declared = (config.presets ?? [])
    .map((preset) => (typeof preset === 'string' ? bundledPresets[preset] : preset))
    .filter(Boolean) as Preset[]

  // Always include the playground's internal error-recipe preset.
  config.presets = [...declared, playgroundPreset]

  return getResolvedConfig(config)
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
