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

  const rule = postcss.atRule({
    name: 'layer',
    params: 'tokens',
    nodes: root.nodes,
  })

  const output = rule.toString()
  ctx.hooks.callHook('generator:css', 'keyframes.css', output)
  return output
}
