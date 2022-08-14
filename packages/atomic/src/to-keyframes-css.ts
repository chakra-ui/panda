import postcss from 'postcss'
import { toCss } from './to-css'
import { Dict } from './types'

function toString(name: string, definition: Dict) {
  return postcss
    .atRule({
      name: 'keyframes',
      params: name,
      nodes: toCss(definition).root.nodes,
    })
    .toString()
}

export function toKeyframeCss(values: Dict) {
  const root: string[] = []
  for (const [name, definition] of Object.entries(values)) {
    root.push(toString(name, definition), '\r')
  }
  return root.join('\n')
}
