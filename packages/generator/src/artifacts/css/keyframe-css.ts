import { Context, Stylesheet, stringify } from '@pandacss/core'

export function generateKeyframeCss(ctx: Context, sheet: Stylesheet) {
  const { keyframes = {} } = ctx.config.theme ?? {}
  let css = ''

  for (const [name, definition] of Object.entries(keyframes)) {
    css += stringify({
      [`@keyframes ${name}`]: definition,
    })
  }

  sheet.layers.tokens.append(css)
  void ctx.hooks.callHook('generator:css', 'keyframes.css', '')
}
