import { mergeHooks } from '@pandacss/config'
import { pluginLightningcss } from '@pandacss/plugin-lightningcss'
import { pluginSvelte } from '@pandacss/plugin-svelte'
import { pluginVue } from '@pandacss/plugin-vue'
import type { Config, LoadConfigResult, PandaPlugin } from '@pandacss/types'
import browserslist from 'browserslist'

const RESOLVED_HOOKS_NAME = '__resolved__'

export function getAutoPlugins(config: Config): PandaPlugin[] {
  const plugins: PandaPlugin[] = [pluginVue(), pluginSvelte()]

  if (config.lightningcss) {
    plugins.push(pluginLightningcss())
  }

  return plugins
}

export function applyAutoPlugins(conf: LoadConfigResult, cwd: string) {
  if (conf.config.lightningcss && !conf.config.browserslist) {
    conf.config.browserslist ||= browserslist.findConfig(cwd)?.defaults
  }

  const autoPlugins = getAutoPlugins(conf.config)

  conf.hooks = mergeHooks([...autoPlugins, { name: RESOLVED_HOOKS_NAME, hooks: conf.hooks }])
  conf.config.plugins = [...autoPlugins, ...(conf.config.plugins ?? [])]
}
