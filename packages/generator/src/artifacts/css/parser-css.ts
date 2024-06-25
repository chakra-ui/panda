import type { StyleDecoder } from '@pandacss/core'
import { logger } from '@pandacss/logger'
import type { Context } from '@pandacss/core'

export const generateParserCss = (ctx: Context, decoder: StyleDecoder) => {
  if (!decoder) return ''

  const sheet = ctx.createSheet()
  const { minify } = ctx.config

  sheet.processDecoder(decoder)

  try {
    const css = sheet.toCss({ minify })
    return css
  } catch (err) {
    logger.error('serializer:css', 'Failed to serialize CSS: ' + err)
    return ''
  }
}
