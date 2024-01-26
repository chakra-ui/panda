import { Context, Stylesheet, stringify } from '@pandacss/core'
import type { Dict } from '@pandacss/types'

export function generateKeyframeCss(ctx: Context, sheet: Stylesheet) {
  const { keyframes = {} } = ctx.config.theme ?? {}

  const result: Dict = {}

  for (const [name, definition] of Object.entries(keyframes)) {
    result[`@keyframes ${name}`] = definition
  }

  let css = stringify(sheet.serialize(result))

  if (ctx.hooks['cssgen:done']) {
    css = ctx.hooks['cssgen:done']({ artifact: 'keyframes', content: css }) ?? css
  }

  sheet.layers.tokens.append(css)
}
