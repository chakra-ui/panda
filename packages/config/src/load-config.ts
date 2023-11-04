import { ConfigError, ConfigNotFoundError } from '@pandacss/error'
import { logger } from '@pandacss/logger'
import type { Config, LoadConfigResult } from '@pandacss/types'
import { bundle } from './bundle'
import { findConfigFile } from './find-config'
import { getResolvedConfig } from './get-resolved-config'

import { preset as presetBase } from '@pandacss/preset-base'
import { preset as presetPanda } from '@pandacss/preset-panda'

const bundledPresets = {
  '@pandacss/preset-base': presetBase,
  '@pandacss/preset-panda': presetPanda,
  '@pandacss/dev/presets': presetPanda,
}
const bundledPresetsNames = Object.keys(bundledPresets)
const isBundledPreset = (preset: string): preset is keyof typeof bundledPresets => bundledPresetsNames.includes(preset)

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

const serializeConfig = (config: Config) =>
  JSON.stringify(config, (_key, value) => {
    if (typeof value === 'function') {
      return value.toString()
    }

    return value
  })

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
    result.config.presets.forEach((preset: any) => {
      if (typeof preset === 'string' && isBundledPreset(preset)) {
        presets.add(bundledPresets[preset])
      } else {
        presets.add(preset)
      }
    })
  } else if (!result.config.eject) {
    presets.add(presetPanda)
  }

  result.config.presets = Array.from(presets)

  const mergedConfig = await getResolvedConfig(result.config, cwd)
  const serialized = serializeConfig(mergedConfig)
  const deserialize = () => JSON.parse(serialized)

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
