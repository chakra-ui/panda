import { logger } from '@pandacss/logger'
import type { Context } from '../../engines'

export const generateParserCss = (ctx: Context) => (filePath?: string) => {
  const styles = ctx.collectStyles()
  if (!styles) return ''

  const sheet = ctx.createSheet()
  const { minify, optimize } = ctx.config

  sheet.processStyleCollector(styles)

  try {
    const css = sheet.toCss({ minify, optimize })
    ctx.hooks.callHook('parser:css', filePath ?? '', css)
    return css
  } catch (err) {
    logger.error('serializer:css', 'Failed to serialize CSS: ' + err)
    return ''
  }
}
