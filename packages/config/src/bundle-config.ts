import { logger } from '@pandacss/logger'
import { PandaError } from '@pandacss/shared'
import type { Config } from '@pandacss/types'
import { bundleNRequire } from 'bundle-n-require'
import { resolve } from 'path'
import { findConfig } from './find-config'
import type { BundleConfigResult, ConfigFileOptions } from './types'

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
