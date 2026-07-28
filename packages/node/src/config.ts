import { loadConfig } from '@pandacss/config'
import type { Config } from '@pandacss/types'
import { applyAutoPlugins } from './auto-plugins'
import { PandaContext } from './create-context'
import { loadTsConfig } from './load-tsconfig'

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

  applyAutoPlugins(conf, cwd)

  const tsConfResult = await loadTsConfig(conf, cwd)

  if (tsConfResult) {
    Object.assign(conf, tsConfResult)
  }

  return new PandaContext(conf)
}
