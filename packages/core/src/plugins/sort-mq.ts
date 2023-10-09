import type { Container, TransformCallback } from 'postcss'
import { sortAtRules } from './sort-at-rules'
import { match, P } from 'ts-pattern'

export default function sortMediaQueries(): TransformCallback {
  const inner = (root: Container) => {
    root.nodes.sort((a, b) => {
      return match({ a, b })
        .with(
          {
            a: { type: 'atrule', name: 'media' },
            b: { type: 'atrule', name: 'media' },
          },
          ({ a, b }) => {
            // console.log(a.params, b.params)
            return sortAtRules(a.params, b.params)
          },
        )
        .with({ a: { type: 'atrule', name: 'media' }, b: P.any }, () => {
          return 1
        })
        .with({ a: P.any, b: { type: 'atrule', name: 'media' } }, () => {
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
