import type { Config, Preset } from '@pandacss/types'
import { bundle } from './bundle-config'
import { mergeConfigs } from './merge-config'

type Extendable<T> = T & { extend?: T }
type ExtendableConfig = Extendable<Config>

/**
 * Recursively merge all presets into a single config (depth-first using stack)
 */
export async function getResolvedConfig(config: ExtendableConfig, cwd: string) {
  const stack: ExtendableConfig[] = [config]
  const configs: ExtendableConfig[] = []

  while (stack.length > 0) {
    const current = stack.pop()!

    const subPresets = current.presets ?? []
    for (const subPreset of subPresets) {
      if (typeof subPreset === 'string') {
        const presetModule = await bundle(subPreset, cwd)
        stack.push(presetModule.config)
      } else {
        stack.push(await subPreset)
      }
    }

    configs.unshift(current)
  }

  const merged = mergeConfigs(configs) as Config

  // Keep the resolved presets so we can find the origin of a token
  merged.presets = configs.slice(0, -1) as Preset[]

  return merged
}
