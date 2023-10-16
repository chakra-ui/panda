import { logger } from '@pandacss/logger'
import type { ParserResultType } from '@pandacss/types'
import type { Context } from '../../engines'

export const generateParserCss = (ctx: Context) => (parserResult: ParserResultType) => {
  const filePath = parserResult.filePath ?? ''
  const styles = parserResult.collectStyles()
  if (!styles) return ''

  // console.time('generateParserCss')
  const sheet = ctx.createSheet()
  const { minify, optimize } = ctx.config

  sheet.processStylesCollector(styles)

  // TODO pattern ?
  // console.timeEnd('generateParserCss')

  try {
    // console.time('sheet.toCss')
    const css = sheet.toCss({ minify, optimize })
    // console.timeEnd('sheet.toCss')
    ctx.hooks.callHook('parser:css', filePath, css)
    return css
  } catch (err) {
    logger.error('serializer:css', 'Failed to serialize CSS: ' + err)
    return ''
  }
}
