import { parseJson, stringifyJson } from '@pandacss/shared'
import type { LoadConfigResult, UserConfig } from '@pandacss/types'
import { getBundledPreset, presetBase, presetPanda } from './bundled-preset'
import { getResolvedConfig } from './get-resolved-config'
import type { BundleConfigResult } from './types'
import { validateConfig } from './validate-config'
import { utils } from './utils'

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

  const config = await getResolvedConfig(result.config, cwd)

  validateConfig(config as UserConfig)

  const { hooks = {} } = result.config

  const loadConfigResult = {
    ...result,
    config: config as any,
  } as LoadConfigResult

  // This allows editing the config before the context is created
  if (hooks['config:resolved']) {
    const result = await hooks['config:resolved']({
      config: loadConfigResult.config,
      path: loadConfigResult.path,
      dependencies: loadConfigResult.dependencies,
      utils,
    })
    if (result) {
      loadConfigResult.config = result
    }
  }

  const serialized = stringifyJson(loadConfigResult.config)
  const deserialize = () => parseJson(serialized)

  return { ...loadConfigResult, serialized, deserialize, hooks }
}
