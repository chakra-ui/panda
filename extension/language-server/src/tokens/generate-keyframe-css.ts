import { toCss } from '@pandacss/core'
import postcss from 'postcss'
import { PandaContext } from '@pandacss/node'

/** @see packages/generator/src/artifacts/css/keyframe-css.ts */
export function generateKeyframeCss(ctx: PandaContext, keyframeName: string) {
  const { keyframes = {} } = ctx.config.theme ?? {}
  const root = postcss.root()

  const keyframe = keyframes[keyframeName]
  if (!keyframe) return ''

  root.append(
    postcss.atRule({
      name: 'keyframes',
      params: keyframeName,
      nodes: toCss(keyframe).root.nodes,
    }),
  )

  const rule = postcss.atRule({
    name: 'layer',
    params: 'tokens',
    nodes: root.nodes,
  })

  return rule.toString()
}
