import type { Context, Stylesheet } from '@pandacss/core'
import { toCss } from '@pandacss/core'
import postcss from 'postcss'

export function generateKeyframeCss(ctx: Context, sheet: Stylesheet) {
  const { keyframes = {} } = ctx.config.theme ?? {}
  const root = postcss.root()

  for (const [name, definition] of Object.entries(keyframes)) {
    root.append(
      postcss.atRule({
        name: 'keyframes',
        params: name,
        nodes: toCss(definition).root.nodes,
      }),
    )
  }

  sheet.layers.tokens.append(root)
  void ctx.hooks.callHook('generator:css', 'keyframes.css', '')
}
