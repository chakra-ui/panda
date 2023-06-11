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
  const presets = new Set<any>()
  presets.add(require('@pandacss/preset-base').default)

  if (!result.config.presets) {
    presets.add(require('@pandacss/preset-panda').default)
  } else {
    result.config.presets.forEach((preset: any) => {
      if (typeof preset === 'string' && preset.startsWith('@pandacss')) {
        try {
          const mod = require(preset).default
          presets.add(mod)
        } catch (error) {
          logger.error('bundle', `Failed to load preset "${preset}"`)
        }
      } else {
        presets.add(preset)
      }
    })
  }

  result.config.presets = Array.from(presets)

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
