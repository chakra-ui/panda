import { ConfigError, ConfigNotFoundError } from '@pandacss/error'
import { logger } from '@pandacss/logger'
import { findConfigFile } from './find-config'
import { getResolvedConfig } from './merge-config'
import { bundle } from './bundle'

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

  logger.debug('config:path', filePath)

  const result = await bundle(filePath, cwd)

  // TODO: Validate config shape
  if (typeof result.config !== 'object') {
    throw new ConfigError(`💥 Config must export or return an object.`)
  }

  // set default presets
  result.config.presets ||= ['@pandacss/dev/presets']

  const mergedConfig = await getResolvedConfig(result.config, cwd)

  return {
    ...result,
    config: mergedConfig,
    path: filePath,
  }
}
