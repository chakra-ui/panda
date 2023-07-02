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

  const configs: ExtendableConfig[] = [config]
  while (presets.length > 0) {
    const preset = presets.shift()!

    if (!isPlaygroundPreset(preset)) {
      console.error(`Invalid preset: ${preset}`)
      return
    }

    if (preset instanceof Promise) {
      preset.then((result) => {
        configs.push(result)
        presets.unshift(...(result.presets ?? []))
      })
    } else {
      configs.push(preset)
      presets.unshift(...(preset.presets ?? []))
    }
  }
  console.log('configs', configs)
  console.log('configs_merge', mergeConfigs(configs))
  return mergeConfigs(configs) as Config
}

function isPlaygroundPreset(preset: string | Preset | Promise<Preset>): preset is Preset | Promise<Preset> {
  return typeof preset !== 'string'
}
