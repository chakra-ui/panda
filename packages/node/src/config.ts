import { loadConfig } from '@pandacss/config'
import type { Config, LoggerInterface } from '@pandacss/types'
import browserslist from 'browserslist'
import { PandaContext } from './create-context'
import { loadTsConfig } from './load-tsconfig'

export interface LoadConfigOptions {
  cwd?: string
  config?: Config
  configPath?: string
  logger: LoggerInterface
}

export async function loadConfigAndCreateContext(options: LoadConfigOptions) {
  const { config, configPath, logger } = options

  const cwd = options.cwd ?? options?.config?.cwd ?? process.cwd()
  const conf = await loadConfig({ cwd, file: configPath, logger })

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
