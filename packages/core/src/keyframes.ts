import type { KeyframeDefinition, Keyframes } from '@pandacss/types'
import postcss from 'postcss'
import { toCss } from './to-css'

function getKeyframeCss(name: string, definition: KeyframeDefinition) {
  return postcss.atRule({
    name: 'keyframes',
    params: name,
    nodes: toCss(definition).root.nodes,
  })
}

export function toKeyframeCss(keyframes: Keyframes) {
  const root = postcss.root()

  for (const [name, definition] of Object.entries(keyframes)) {
    root.append(getKeyframeCss(name, definition.value))
  }

  const rule = postcss.atRule({
    name: 'layer',
    params: 'tokens',
    nodes: root.nodes,
  })

  return rule.toString()
}
