import type { AtRule } from 'postcss'
import { isMatching } from 'ts-pattern'
import { optimizeCss } from './optimize'
import { safeParse } from './safe-parse'

// write postcss plugin to merge two css strings
// merge layer (utilities) at-rules and override other layers
export function mergeCss(oldCss: string, newCss: string) {
  const oldRoot = safeParse(oldCss)
  const newRoot = safeParse(newCss)

  // from the old root, get the at rules with the layer name "utilities"
  const oldUtilities = oldRoot.nodes.filter(
    isMatching({
      type: 'atrule',
      name: 'layer',
      params: 'utilities',
    }),
  ) as AtRule[]

  // in the new root, append the old utilities to the new utilities
  newRoot.walkAtRules('layer', (rule) => {
    if (rule.params !== 'utilities') return
    oldUtilities.forEach((oldUtil) => {
      rule.append(oldUtil.nodes)
    })
  })

  return optimizeCss(newRoot)
}
