import { loadConfigFile } from '@pandacss/config'
import type { Config, ConfigResultWithHooks, PandaHooks } from '@pandacss/types'
import { createDebugger, createHooks } from 'hookable'
import { lookItUpSync } from 'look-it-up'
import { parse } from 'tsconfck'
import { createContext } from './create-context'

const configs = ['.ts', '.js', '.mjs', '.cjs']

export function findConfig() {
  for (const config of configs) {
    const result = lookItUpSync(`panda.config${config}`)
    if (result) {
      return result
    }
  }
}

export async function loadConfigAndCreateContext(options: { cwd?: string; config?: Config; configPath?: string } = {}) {
  const hooks = createHooks<PandaHooks>()

  const { cwd = process.cwd(), config, configPath } = options
  const conf = await loadConfigFile({ cwd, file: configPath })

  if (config) {
    Object.assign(conf.config, config)
  }
  if (options.cwd) {
    conf.config.cwd = options.cwd
  }

  const tsconfigResult = await parse(conf.path, { root: cwd, resolveWithEmptyIfConfigNotFound: true })
  if (tsconfigResult) {
    conf.tsconfig = tsconfigResult.tsconfig
    conf.tsconfigFile = tsconfigResult.tsconfigFile
  }

  conf.config.outdir ??= 'styled-system'

  // Register user hooks
  if (conf.config.hooks) {
    hooks.addHooks(conf.config.hooks)
  }

  await hooks.callHook('config:resolved', conf)
  if (conf.config.logLevel === 'debug') {
    createDebugger(hooks, { tag: 'panda' })
  }

  return createContext({ ...conf, hooks } as ConfigResultWithHooks)
}
