import type { Config, Preset } from '@pandacss/types'
import { mergeConfigs } from '@pandacss/config/merge'

type Extendable<T> = T & { extend?: T }
type ExtendableConfig = Extendable<Config>

/**
 * Recursively merge all presets into a single config
 * PLayground won't be able to handle bundling presets
 */
export function getResolvedConfig(config: ExtendableConfig) {
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
