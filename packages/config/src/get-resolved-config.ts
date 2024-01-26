import type { Config } from '@pandacss/types'
import { bundle } from './bundle-config'
import { mergeConfigs } from './merge-config'

type Extendable<T> = T & { extend?: T }
type ExtendableConfig = Extendable<Config>

/**
 * Recursively merge all presets into a single config
 */
export async function getResolvedConfig(config: ExtendableConfig, cwd: string) {
  const presets = config.presets ?? []

  const configs: ExtendableConfig[] = []
  while (presets.length > 0) {
    const preset = await presets.shift()!
    if (typeof preset === 'string') {
      const presetModule = await bundle(preset, cwd)
      configs.unshift(await presetModule.config)
      presets.unshift(...((await presetModule.config.presets) ?? []))
    } else {
      configs.unshift(preset)
      presets.unshift(...(preset.presets ?? []))
    }
  }

  configs.unshift(config)
  return mergeConfigs(configs) as Config
}
