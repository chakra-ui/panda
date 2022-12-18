import type { AtRule, Container, TransformCallback } from 'postcss'
import sortAtRules from 'sort-css-media-queries'

export default function sortMediaQueries(): TransformCallback {
  const inner = (root: Container) => {
    const parentMap = new Map<Container, AtRule[]>()

    root.walkAtRules('media', (atRule) => {
      const clone = atRule.clone()

      const parent = atRule.parent || root

      parentMap.get(parent) || parentMap.set(parent, [])
      parentMap.get(parent)!.push(clone)

      atRule.remove()
    })

    parentMap.forEach((atRules, parent) => {
      atRules
        .sort((a, b) => sortAtRules(a.params, b.params))
        .forEach((atRule) => {
          parent.append(atRule)
        })
    })
  }

  return inner
}

sortMediaQueries.postcssPlugin = 'panda-sort-mq'
