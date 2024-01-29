import { diffConfigs, loadConfig } from '@pandacss/config'
import { Generator } from '@pandacss/generator'
import { logger } from '@pandacss/logger'
import type { Config, DiffConfigResult, LoadConfigResult } from '@pandacss/types'

export class DiffEngine {
  private prevConfig: Config | undefined

  constructor(private ctx: Generator) {
    this.prevConfig = ctx.conf.deserialize()
  }

  /**
   * Reload config from disk and refresh the context
   */
  async reloadConfigAndRefreshContext(fn?: (conf: LoadConfigResult) => void) {
    const conf = await loadConfig({ cwd: this.ctx.config.cwd, file: this.ctx.conf.path })

    // attach tsconfig options from previous config
    const { tsconfig, tsconfigFile, tsOptions } = this.ctx.conf
    Object.assign(conf, { tsconfig, tsconfigFile, tsOptions })

    return this.refresh(conf, fn)
  }

  /**
   * Update the context from the refreshed config
   * then persist the changes on each affected engines
   * Returns the list of affected artifacts/engines
   */
  refresh(conf: LoadConfigResult, fn?: (conf: LoadConfigResult) => void) {
    const affected = diffConfigs(() => conf.deserialize(), this.prevConfig)

    if (!affected.hasConfigChanged || !this.prevConfig) return affected

    fn?.(conf)
    this.prevConfig = conf.deserialize()

    return affected
  }
}
