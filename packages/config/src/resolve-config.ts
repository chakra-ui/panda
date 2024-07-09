import { logger } from '@pandacss/logger'
import { omit, parseJson, stringifyJson, traverse } from '@pandacss/shared'
import type { LoadConfigResult, UserConfig } from '@pandacss/types'
import { getBundledPreset } from './bundled-preset'
import { getResolvedConfig } from './get-resolved-config'
import type { BundleConfigResult } from './types'
import { validateConfig } from './validate-config'

const hookUtils = {
  omit,
  traverse,
}

/**
 * Resolve the final config (including presets)
 */
export async function resolveConfig(result: BundleConfigResult, cwd: string): Promise<LoadConfigResult> {
  const presets = new Set<any>()

  if (result.config.presets) {
    result.config.presets.forEach((preset: any) => {
      presets.add(getBundledPreset(preset) ?? preset)
    })
  }

  result.config.presets = Array.from(presets)

  const mergedConfig = await getResolvedConfig(result.config, cwd)
  const hooks = mergedConfig.hooks ?? {}

  if (mergedConfig.logLevel) {
    logger.level = mergedConfig.logLevel
  }

  validateConfig(mergedConfig as UserConfig)

  const loadConfigResult = {
    ...result,
    config: mergedConfig as any,
  } as LoadConfigResult

  // This allows editing the config before the context is created
  if (hooks['config:resolved']) {
    const result = await hooks['config:resolved']({
      config: loadConfigResult.config,
      path: loadConfigResult.path,
      dependencies: loadConfigResult.dependencies,
      utils: hookUtils,
    })

    if (result) {
      loadConfigResult.config = result
    }
  }

  const serialized = stringifyJson(loadConfigResult.config)
  const deserialize = () => parseJson(serialized)

  return { ...loadConfigResult, serialized, deserialize, hooks }
}
