import { Stylesheet, toCss } from '@pandacss/core'
import type { Context } from '../../engines'

export function generateKeyframeCss(ctx: Context, sheet: Stylesheet) {
  const { keyframes = {} } = ctx.config.theme ?? {}
  let css = ''

  for (const [name, definition] of Object.entries(keyframes)) {
    css += toCss({
      [`@keyframes ${name}`]: definition,
    })
  }

  sheet.layers.tokens.append(css)
  void ctx.hooks.callHook('generator:css', 'keyframes.css', '')
}
