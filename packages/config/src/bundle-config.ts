import { ConfigError, ConfigNotFoundError } from '@pandacss/error'
import { logger } from '@pandacss/logger'
import type { Config } from '@pandacss/types'
import { bundleNRequire } from 'bundle-n-require'
import { findConfig } from './find-config'
import type { ConfigFileOptions } from './types'

export interface BundleConfigResult<T = Config> {
  config: T
  dependencies: string[]
  path: string
}

export async function bundle<T = Config>(filepath: string, cwd: string) {
  const { mod: config, dependencies } = await bundleNRequire(filepath, {
    cwd,
    interopDefault: true,
  })
  return {
    config: (config?.default ?? config) as T,
    dependencies,
  }
}

export async function bundleConfig(options: ConfigFileOptions): Promise<BundleConfigResult> {
  const { cwd, file } = options

  const filePath = findConfig({ cwd, file })

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
