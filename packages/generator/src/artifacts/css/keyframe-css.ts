import { Stylesheet, optimizeCss, toCss } from '@pandacss/core'
import postcss from 'postcss'
import type { Context } from '../../engines'

export function generateKeyframeCss(ctx: Context, sheet?: Stylesheet) {
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

  if (sheet) {
    sheet.getLayer('tokens')?.append(root)
    return
  }

  const rule = postcss.atRule({
    name: 'layer',
    params: ctx.layers.name.tokens,
    nodes: root.nodes,
  })

  const output = optimizeCss(rule.toString(), { minify: ctx.config.minify })

  void ctx.hooks.callHook('generator:css', 'keyframes.css', output)

  return output
}
