import { loadConfig, mergeHooks } from '@pandacss/config'
import type { Config, PandaPlugin } from '@pandacss/types'
import { pluginLightningcss } from '@pandacss/plugin-lightningcss'
import { pluginSvelte } from '@pandacss/plugin-svelte'
import { pluginVue } from '@pandacss/plugin-vue'
import browserslist from 'browserslist'
import { PandaContext } from './create-context'
import { loadTsConfig } from './load-tsconfig'

const RESOLVED_HOOKS_NAME = '__resolved__'

/**
 * Built-in plugins that are auto-injected when using the CLI or PostCSS plugin.
 * These provide Vue/Svelte file support and LightningCSS optimization.
 */
function getAutoPlugins(config: Config): PandaPlugin[] {
  const plugins: PandaPlugin[] = [pluginVue(), pluginSvelte()]

  if (config.lightningcss) {
    plugins.push(pluginLightningcss())
  }

  return plugins
}

/**
 * Load config and create context with auto-injected plugins.
 * Used by the CLI and PostCSS plugin.
 */
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

  // Auto-inject built-in plugins (vue, svelte, lightningcss)
  // Auto plugins run first, then the already-resolved user hooks run after
  const autoPlugins = getAutoPlugins(conf.config)

  // conf.hooks is already properly merged from user plugins + inline hooks by resolveConfig.
  // Prepend auto-plugins before it — don't re-process user plugins to avoid double-execution.
  conf.hooks = mergeHooks([...autoPlugins, { name: RESOLVED_HOOKS_NAME, hooks: conf.hooks }])
  conf.config.plugins = [...autoPlugins, ...(conf.config.plugins ?? [])]

  const tsConfResult = await loadTsConfig(conf, cwd)

  if (tsConfResult) {
    Object.assign(conf, tsConfResult)
  }

  return new PandaContext(conf)
}
