import type { StyleDecoder } from '@pandacss/core'
import type { Context } from '@pandacss/core'

export const generateParserCss = (ctx: Context, decoder: StyleDecoder) => {
  if (!decoder) return ''

  const sheet = ctx.createSheet()
  const { minify, optimize } = ctx.config

  sheet.processDecoder(decoder)

  try {
    const css = sheet.toCss({ minify, optimize })
    return css
  } catch (err) {
    ctx.logger.error('serializer:css', 'Failed to serialize CSS: ' + err)
    return ''
  }
}
