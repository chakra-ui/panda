import { loadConfig } from '@pandacss/config'
import type { Config, ConfigResultWithHooks, PandaHooks } from '@pandacss/types'
import browserslist from 'browserslist'
import { createDebugger, createHooks } from 'hookable'
import { PandaContext } from './create-context'
import { loadTsConfig } from './load-tsconfig'

export async function loadConfigAndCreateContext(options: { cwd?: string; config?: Config; configPath?: string } = {}) {
  const { config, configPath } = options

  const cwd = options.cwd ?? options?.config?.cwd ?? process.cwd()
  const conf = await loadConfig({ cwd, file: configPath })

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

  // Register user hooks
  const hooks = createHooks<PandaHooks>()

  if (conf.config.hooks) {
    hooks.addHooks(conf.config.hooks)
  }

  await hooks.callHook('config:resolved', conf)

  if (conf.config.logLevel === 'debug') {
    createDebugger(hooks, { tag: 'panda' })
  }

  return new PandaContext({ ...conf, hooks } as ConfigResultWithHooks)
}
