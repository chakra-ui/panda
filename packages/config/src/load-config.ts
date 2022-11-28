import { ConfigNotFoundError, ConfigError } from '@pandacss/error'
import { logger } from '@pandacss/logger'
import type { UserConfig } from '@pandacss/types'
import { merge } from 'merge-anything'
import { bundleAndRequire } from './bundle-require'
import { findConfigFile } from './find-config'

type ConfigFileOptions = {
  cwd: string
  file?: string
}

export async function loadConfigFile(options: ConfigFileOptions) {
  const { cwd, file } = options
  const filePath = findConfigFile({ cwd, file })

  if (!filePath) {
    throw new ConfigNotFoundError()
  }

  logger.debug({ type: 'config', path: filePath })

  const result = await bundleAndRequire(filePath, cwd)

  // TODO: Validate config shape
  if (typeof result.config !== 'object') {
    throw new ConfigError(`💥 Config must export or return an object.`)
  }

  const presets = result.config.presets ?? []

  for (const preset of presets) {
    const presetResult = await bundleAndRequire(preset, cwd)
    // TODO: create custom mergeConfig
    result.config = merge({}, presetResult.config, result.config) as any
  }

  delete result.config.presets

  return {
    ...result,
    path: filePath,
  }
}

export type LoadConfigResult = {
  path: string
  config: UserConfig
  dependencies: string[]
}
