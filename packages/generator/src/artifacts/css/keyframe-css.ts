import { Context, Stylesheet, stringify } from '@pandacss/core'
import type { Dict } from '@pandacss/types'

export function generateKeyframeCss(ctx: Context, sheet: Stylesheet) {
  const { keyframes = {} } = ctx.config.theme ?? {}

  const result: Dict = {}

  for (const [name, definition] of Object.entries(keyframes)) {
    result[`@keyframes ${name}`] = definition
  }

  const css = stringify(sheet.serialize(result))

  sheet.layers.tokens.append(css)
  void ctx.hooks.callHook('generator:css', 'keyframes.css', '')
}
