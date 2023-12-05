import { ConfigError, ConfigNotFoundError } from '@pandacss/error'
import { logger } from '@pandacss/logger'
import { parseJson, stringifyJson } from '@pandacss/shared'
import type { LoadConfigResult } from '@pandacss/types'
import { bundle } from './bundle'
import { getBundledPreset, presetBase, presetPanda } from './bundled-preset'
import { findConfigFile } from './find-config'
import { getResolvedConfig } from './get-resolved-config'

interface ConfigFileOptions {
  cwd: string
  file?: string
}

/**
 * Find, load and resolve the final config (including presets)
 */
export async function loadConfigFile(options: ConfigFileOptions) {
  const result = await bundleConfigFile(options)
  return resolveConfigFile(result, options.cwd)
}

/**
 * Resolve the final config (including presets)
 * @pandacss/preset-base: ALWAYS included if NOT using eject: true
 * @pandacss/preset-panda: only included by default if no presets
 */
export async function resolveConfigFile(result: Awaited<ReturnType<typeof bundleConfigFile>>, cwd: string) {
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

  const mergedConfig = await getResolvedConfig(result.config, cwd)

  const serialized = stringifyJson(mergedConfig)
  const deserialize = () => parseJson(serialized)

  return { ...result, serialized, deserialize, config: mergedConfig } as LoadConfigResult
}

/**
 * Find and bundle the config file
 */
export async function bundleConfigFile(options: ConfigFileOptions) {
  const { cwd, file } = options
  const filePath = findConfigFile({ cwd, file })

  if (!filePath) {
    throw new ConfigNotFoundError()
  }

  logger.debug('config:path', filePath)

  const result = await bundle(filePath, cwd)

  // TODO: Validate config shape
  if (typeof result.config !== 'object') {
    throw new ConfigError(`💥 Config must export or return an object.`)
  }

  return {
    ...result,
    config: result.config,
    path: filePath,
  }
}
