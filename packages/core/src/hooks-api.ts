import type { Context } from './context'
import { RuleProcessor } from './rule-processor'

export class HooksApi {
  processor: RuleProcessor

  constructor(private ctx: Context) {
    this.processor = new RuleProcessor(ctx)
  }

  get config() {
    return this.ctx.conf.config
  }

  get configPath() {
    return this.ctx.conf.path
  }

  get dependencies() {
    return this.ctx.conf.dependencies
  }

  get classNames() {
    return this.ctx.decoder.classNames
  }
}
