import postcss from 'postcss'
import { toCss } from './to-css'
import { Dict } from './types'

function expandKeyframe(name: string, dfn: Dict) {
  return postcss
    .atRule({
      name: 'keyframes',
      params: name,
      nodes: toCss(dfn),
    })
    .toString()
}

export function expandKeyframes(values: Dict) {
  const root: string[] = []
  for (const [name, definition] of Object.entries(values)) {
    root.push(expandKeyframe(name, definition), '\r')
  }
  return root.join('\n')
}
