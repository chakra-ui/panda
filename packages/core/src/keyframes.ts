import type { CssKeyframes, Dict } from '@pandacss/types'
import postcss from 'postcss'
import { toCss } from './to-css'

function toString(name: string, definition: Dict) {
  return postcss.atRule({
    name: 'keyframes',
    params: name,
    nodes: toCss(definition).root.nodes,
  })
}

export function toKeyframeCss(values: CssKeyframes) {
  const root = postcss.root()

  for (const [name, definition] of Object.entries(values)) {
    root.append(toString(name, definition))
  }

  const rule = postcss.atRule({
    name: 'layer',
    params: 'tokens', // TODO ctx.layers.tokens
    nodes: root.nodes,
  })

  return rule.toString()
}
