import { logger } from '@pandacss/logger'
import { PandaError } from '@pandacss/shared'
import type { Config } from '@pandacss/types'
import { bundleNRequire } from 'bundle-n-require'
import { findConfig } from './find-config'
import type { BundleConfigResult, ConfigFileOptions } from './types'

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

  logger.debug('config:path', filePath)

  const result = await bundle(filePath, cwd)

  if (typeof result.config !== 'object') {
    throw new PandaError('CONFIG_ERROR', `💥 Config must export or return an object.`)
  }

  result.config.outdir ??= 'styled-system'
  result.config.validation ??= 'error'

  return {
    ...result,
    config: result.config,
    path: filePath,
  }
}
