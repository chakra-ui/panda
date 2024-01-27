import { ConfigError, ConfigNotFoundError } from '@pandacss/error'
import { logger } from '@pandacss/logger'
import type { Config } from '@pandacss/types'
import { bundleNRequire } from 'bundle-n-require'
import { findConfig } from './find-config'
import type { ConfigFileOptions } from './types'
import { resolve } from 'node:path'

export interface BundleConfigResult<T = Config> {
  config: T
  /**
   * List of all the file dependencies (transitive imports) of the config
   */
  dependencies: string[]
  /**
   * Explicitly declared config dependencies (e.g. configDependencies: ['path/to/other/config']) that should trigger a rebuild
   */
  configDependencies: string[]
  path: string
}

export async function bundle<T extends Config = Config>(filepath: string, cwd: string) {
  const { mod, dependencies } = await bundleNRequire(filepath, {
    cwd,
    interopDefault: true,
  })
  const config = (mod?.default ?? mod) as T
  const deps = (config.configDependencies ?? []).map((file) => resolve(cwd, file))
  return {
    config,
    dependencies: dependencies.concat(deps),
    configDependencies: deps,
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

  result.config.outdir ??= 'styled-system'

  return {
    ...result,
    config: result.config,
    path: filePath,
  }
}
