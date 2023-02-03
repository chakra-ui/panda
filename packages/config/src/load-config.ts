import { ConfigError, ConfigNotFoundError } from '@pandacss/error'
import { logger } from '@pandacss/logger'
import { bundleAndRequire } from './bundle-require'
import { findConfigFile } from './find-config'
import { getResolvedConfig } from './merge-config'

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

  const result = await bundleAndRequire(filePath, cwd)

  // TODO: Validate config shape
  if (typeof result.config !== 'object') {
    throw new ConfigError(`💥 Config must export or return an object.`)
  }

  // set default presets
  result.config.presets ||= ['css-panda/presets']

  const mergedConfig = await getResolvedConfig(result.config, cwd)

  return {
    ...result,
    config: mergedConfig,
    path: filePath,
  }
}
