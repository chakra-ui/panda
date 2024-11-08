import { loadConfig } from '@pandacss/config'
import type { Config } from '@pandacss/types'
import browserslist from 'browserslist'
import { PandaContext } from './create-context'
import { loadTsConfig } from './load-tsconfig'

export async function loadConfigAndCreateContext(options: { cwd?: string; config?: Config; configPath?: string } = {}) {
  const { config, configPath } = options

  const cwd = options.cwd ?? options?.config?.cwd ?? process.cwd()
  const tsConfResult = await loadTsConfig(cwd)
  const conf = await loadConfig({ cwd, file: configPath, customConditions: tsConfResult?.customConditions ?? [] })

  if (config) {
    Object.assign(conf.config, config)
  }

  if (options.cwd) {
    conf.config.cwd = options.cwd
  }

  if (conf.config.lightningcss && !conf.config.browserslist) {
    conf.config.browserslist ||= browserslist.findConfig(cwd)?.defaults
  }

  if (tsConfResult) {
    Object.assign(conf, tsConfResult)
  }

  return new PandaContext(conf)
}
