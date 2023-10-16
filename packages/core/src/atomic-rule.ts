import { logger } from '@pandacss/logger'
import type { Dict } from '@pandacss/types'
import postcss, { CssSyntaxError } from 'postcss'
import { toCss } from './to-css'

export interface ProcessOptions {
  styles: Dict
}

export class AtomicRule {
  constructor(public layer: postcss.AtRule) {}

  process(options: ProcessOptions) {
    const { styles } = options

    // shouldn't happen, but just in case
    if (typeof styles !== 'object') return

    try {
      this.layer.append(toCss(styles).toString())
    } catch (error) {
      if (error instanceof CssSyntaxError) {
        logger.error('sheet', error.message)
        logger.error('sheet', error.showSourceCode())
        error.plugin && logger.error('sheet', `By plugin: ${error.plugin}:`)
      }
    }
    return
  }
}
