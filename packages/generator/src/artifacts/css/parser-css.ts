import type { StyleDecoder } from '@pandacss/core'
import { logger } from '@pandacss/logger'
import type { Context } from '../../engines'

export const generateParserCss = (ctx: Context, decoder: StyleDecoder, filePath?: string) => {
  if (!decoder) return ''

  const sheet = ctx.createSheet()
  const { minify, optimize } = ctx.config

  sheet.processDecoder(decoder)

  try {
    const css = sheet.toCss({ minify, optimize })
    ctx.hooks.callHook('parser:css', filePath ?? '', css)
    return css
  } catch (err) {
    logger.error('serializer:css', 'Failed to serialize CSS: ' + err)
    return ''
  }
}
