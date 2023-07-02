import type { Config } from '@pandacss/types'
import { bundle } from './bundle'
import { mergeConfigs } from './merge'

type Extendable<T> = T & { extend?: T }
type ExtendableConfig = Extendable<Config>

/**
 * Recursively merge all presets into a single config
 */
export async function getResolvedConfig(config: ExtendableConfig, cwd: string) {
  const presets = config.presets ?? []

  const configs: ExtendableConfig[] = [config]
  while (presets.length > 0) {
    const preset = await presets.shift()!
    if (typeof preset === 'string') {
      const presetModule = await bundle(preset, cwd)
      configs.push(await presetModule.config)
      presets.unshift(...((await presetModule.config.presets) ?? []))
    } else {
      configs.push(preset)
      presets.unshift(...(preset.presets ?? []))
    }
  }

  return mergeConfigs(configs) as Config
}
