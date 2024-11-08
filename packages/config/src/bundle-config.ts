import { logger } from '@pandacss/logger'
import { PandaError } from '@pandacss/shared'
import type { Config } from '@pandacss/types'
import { bundleNRequire } from 'bundle-n-require'
import { findConfig } from './find-config'
import type { BundleConfigResult, ConfigFileOptions } from './types'

export async function bundle<T extends Config = Config>(
  filepath: string,
  cwd: string,
  customConditions: string[] = [],
) {
  console.log({ customConditions })
  const { mod, dependencies } = await bundleNRequire(filepath, {
    cwd,
    interopDefault: true,
    esbuildOptions: {
      conditions: customConditions,
    },
  })

  const config = (mod?.default ?? mod) as T

  return {
    config,
    dependencies,
  }
}

export async function bundleConfig(options: ConfigFileOptions): Promise<BundleConfigResult> {
  const { cwd, file } = options

  const filePath = findConfig({ cwd, file })

  logger.debug('config:path', filePath)

  const result = await bundle(filePath, cwd, options.customConditions)

  if (typeof result.config !== 'object') {
    throw new PandaError('CONFIG_ERROR', `💥 Config must export or return an object.`)
  }

  result.config.outdir ??= 'styled-system'
  result.config.validation ??= 'warn'

  return {
    ...result,
    config: result.config,
    path: filePath,
  }
}
