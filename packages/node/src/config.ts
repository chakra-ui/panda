import { loadConfig } from '@pandacss/config'
import type { Config, LoadConfigResult } from '@pandacss/types'
import browserslist from 'browserslist'
import { PandaContext } from './create-context'
import { loadTsConfig } from './load-tsconfig'
import { loadInMemoryConfig } from '../../config/src/load-config'
import { PandaError } from '@pandacss/shared'
import { logger } from '@pandacss/logger'

interface LoadConfigAndCreateContextOptions {
  cwd?: string
  config?: Config
  configPath?: string
}

export async function loadConfigAndCreateContext(options: LoadConfigAndCreateContextOptions = {}) {
  const { config, configPath } = options

  const cwd = options.cwd ?? options?.config?.cwd ?? process.cwd()
  let conf: LoadConfigResult

  try {
    conf = await loadConfig({ cwd, file: configPath })
  } catch (error) {
    const isConfigNotFound = error instanceof PandaError && error.message.includes('Cannot find config file')
    if (isConfigNotFound) {
      logger.info('config:path', `Using in-memory config`)

      conf = await loadInMemoryConfig()
    } else {
      throw error
    }
  }

  if (config) {
    Object.assign(conf.config, config)
  }

  if (options.cwd) {
    conf.config.cwd = options.cwd
  }

  if (conf.config.lightningcss && !conf.config.browserslist) {
    conf.config.browserslist ||= browserslist.findConfig(cwd)?.defaults
  }

  const tsConfResult = await loadTsConfig(conf, cwd)

  if (tsConfResult) {
    Object.assign(conf, tsConfResult)
  }

  return new PandaContext(conf)
}
