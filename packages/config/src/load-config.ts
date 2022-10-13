import { ConfigNotFoundError, ConfigError } from '@css-panda/error'
import { logger } from '@css-panda/logger'
import type { UserConfig } from '@css-panda/types'
import { bundleConfigFile } from './bundle-config'
import { findConfigFile } from './find-config'
import { loadBundledFile } from './load-bundled-config'

type ConfigFileOptions = {
  cwd: string
  file?: string
}

export async function loadConfigFile(options: ConfigFileOptions) {
  const { cwd, file } = options
  const { filepath, isESM } = findConfigFile({ cwd, file }) ?? {}

  if (!filepath) {
    throw new ConfigNotFoundError()
  }

  logger.debug({ type: 'config', path: filepath })

  const bundled = await bundleConfigFile(filepath)
  logger.debug({ type: 'config', msg: 'Bundled Config File' })

  const dependencies = bundled.dependencies ?? []

  let config: UserConfig
  if (isESM) {
    config = require('node-eval')(bundled.code).default
  } else {
    config = await loadBundledFile(filepath, bundled.code)
  }

  if (typeof config !== 'object') {
    throw new ConfigError(`💥 Config must export or return an object.`)
  }

  return {
    path: filepath,
    config,
    dependencies,
    code: bundled.code,
  }
}

export type LoadConfigResult = {
  path: string
  config: UserConfig
  dependencies: string[]
  code: string
}
