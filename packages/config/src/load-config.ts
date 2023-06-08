import { ConfigError, ConfigNotFoundError } from '@pandacss/error'
import { logger } from '@pandacss/logger'
import type { LoadConfigResult } from '@pandacss/types'
import { bundle } from './bundle'
import { findConfigFile } from './find-config'
import { getResolvedConfig } from './merge-config'

type ConfigFileOptions = {
  cwd: string
  file?: string
}

export async function loadConfigFile(options: ConfigFileOptions) {
  const result = await bundleConfigFile(options)
  return resolveConfigFile(result, options.cwd)
}

export async function resolveConfigFile(result: Awaited<ReturnType<typeof bundleConfigFile>>, cwd: string) {
  const presets = [require('@pandacss/preset-base')]

  if (!result.config.presets) {
    presets.push('@pandacss/dev/presets')
  } else {
    presets.push(...result.config.presets)
  }

  result.config.presets = presets

  const mergedConfig = await getResolvedConfig(result.config, cwd)

  return { ...result, config: mergedConfig } as LoadConfigResult
}

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
