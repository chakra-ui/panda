import { parseJson, stringifyJson } from '@pandacss/shared'
import type { LoadConfigResult, UserConfig } from '@pandacss/types'
import { type BundleConfigResult } from './bundle-config'
import { getBundledPreset, presetBase, presetPanda } from './bundled-preset'
import { getResolvedConfig } from './get-resolved-config'
import { checkConfig, validateConfig } from './validate-config'

/**
 * Resolve the final config (including presets)
 * @pandacss/preset-base: ALWAYS included if NOT using eject: true
 * @pandacss/preset-panda: only included by default if no presets
 */
export async function resolveConfig(result: BundleConfigResult, cwd: string): Promise<LoadConfigResult> {
  const presets = new Set<any>()

  if (!result.config.eject) {
    presets.add(presetBase)
  }

  if (result.config.presets) {
    //
    result.config.presets.forEach((preset: any) => {
      presets.add(getBundledPreset(preset) ?? preset)
    })
    //
  } else if (!result.config.eject) {
    presets.add(presetPanda)
  }

  result.config.presets = Array.from(presets)

  checkConfig(result.config)

  const mergedConfig = await getResolvedConfig(result.config, cwd)
  validateConfig(mergedConfig as UserConfig)

  const hooks = result.config.hooks ?? {}

  // This allows editing the config before the context is created
  const loadConfigResult = { ...result, config: mergedConfig as any } as LoadConfigResult
  await hooks['config:resolved']?.({ conf: loadConfigResult })

  const serialized = stringifyJson(loadConfigResult.config)
  const deserialize = () => parseJson(serialized)

  return { ...loadConfigResult, serialized, deserialize, hooks }
}
