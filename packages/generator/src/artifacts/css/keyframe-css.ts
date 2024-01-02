import { Stylesheet, toCss } from '@pandacss/core'
import postcss from 'postcss'
import type { Context } from '../../engines'

export function generateKeyframeCss(ctx: Context, sheet: Stylesheet) {
  const { keyframes = {} } = ctx.config.theme ?? {}
  const root = postcss.root()

  for (const [name, definition] of Object.entries(keyframes)) {
    root.append(
      postcss.atRule({
        name: 'keyframes',
        params: name,
        nodes: [postcss.parse(toCss(definition))],
      }),
    )
  }

  sheet.layers.tokens.append(root)
  void ctx.hooks.callHook('generator:css', 'keyframes.css', '')
}
