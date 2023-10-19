import { logger } from '@pandacss/logger'
import type { Context } from '../../engines'
import type { StyleCollectorType } from 'packages/types/dist'

export const generateParserCss = (ctx: Context) => (collector: StyleCollectorType, filePath?: string) => {
  if (!collector) return ''

  const sheet = ctx.createSheet()
  const { minify, optimize } = ctx.config

  sheet.processStyleCollector(collector)

  try {
    const css = sheet.toCss({ minify, optimize })
    ctx.hooks.callHook('parser:css', filePath ?? '', css)
    return css
  } catch (err) {
    logger.error('serializer:css', 'Failed to serialize CSS: ' + err)
    return ''
  }
}
