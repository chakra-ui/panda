import { convertTsPathsToRegexes, loadConfig } from '@pandacss/config'
import type { Config, ConfigResultWithHooks, PandaHooks } from '@pandacss/types'
import { createDebugger, createHooks } from 'hookable'
import { parse } from 'tsconfck'
import { PandaContext } from './create-context'

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

  const tsconfigResult = await parse(conf.path, {
    root: cwd,
    // @ts-ignore
    resolveWithEmptyIfConfigNotFound: true,
  })

  if (tsconfigResult) {
    conf.tsconfig = tsconfigResult.tsconfig
    conf.tsconfigFile = tsconfigResult.tsconfigFile

    const options = tsconfigResult.tsconfig?.compilerOptions

    if (options?.paths) {
      const baseUrl = options.baseUrl
      conf.tsOptions = {
        baseUrl,
        pathMappings: convertTsPathsToRegexes(options.paths, baseUrl ?? cwd),
      }
    }
  }

  conf.config.outdir ??= 'styled-system'

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
