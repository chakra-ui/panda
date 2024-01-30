import type { Container, TransformCallback } from 'postcss'
import { P, match } from 'ts-pattern'
import { sortAtRules } from '../sort-at-rules'

const atRuleName = P.union('media', 'container')

export default function sortMediaQueries(): TransformCallback {
  const inner = (root: Container) => {
    root.nodes.sort((a, b) => {
      return match({ a, b })
        .with(
          {
            a: { type: 'atrule', name: atRuleName },
            b: { type: 'atrule', name: atRuleName },
          },
          ({ a, b }) => {
            return sortAtRules(a.params, b.params)
          },
        )
        .with({ a: { type: 'atrule', name: atRuleName }, b: P.any }, () => {
          return 1
        })
        .with({ a: P.any, b: { type: 'atrule', name: atRuleName } }, () => {
          return -1
        })
        .otherwise(() => {
          return 0
        })
    })

    // recursive sort
    root.nodes.forEach((node) => {
      if ('nodes' in node) {
        inner(node)
      }
    })
  }

  return inner
}

sortMediaQueries.postcssPlugin = 'panda-sort-mq'
