import type { Context } from './context'
import { RuleProcessor } from './rule-processor'

export class Api {
  processor: RuleProcessor

  constructor(private ctx: Context) {
    this.processor = new RuleProcessor(ctx)
  }

  get config() {
    return this.ctx.conf.config
  }
}
