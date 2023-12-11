import { toCss } from '@pandacss/core'
import postcss from 'postcss'
import type { Context } from '../../engines'

export function generateKeyframeCss(ctx: Context) {
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

  ctx.layers.tokens.append(root)
  void ctx.hooks.callHook('generator:css', 'keyframes.css', '')
}
