import { AtRule, Container, Root, TransformCallback } from 'postcss'
import sortBy from 'sort-css-media-queries'

// sort media queries within at-rule directives or at the root
export default function sortMediaQueries(): TransformCallback {
  return (root) => {
    // create array of [rulesWithoutLayer, rulesWithLayer]
    const rules = root.nodes.reduce(
      (acc, node) => {
        if (node.type === 'atrule' && node.name === 'layer') {
          acc[1].push(node)
        } else {
          acc[0].push(node as any)
        }
        return acc
      },
      [[], []] as [Container[], AtRule[]],
    )

    // sort media queries within each array
    const [rulesWithoutLayer, rulesWithLayer] = rules
    // create root for rules without layer
    const rootWithoutLayer = new Root({ nodes: rulesWithoutLayer })
    sortMediaQuery(rootWithoutLayer)

    const roots: any[] = []

    rulesWithLayer.forEach((rule) => {
      const newRule = rule.clone()
      roots.push(newRule)
      sortMediaQuery(newRule)
    })

    // replace root nodes with sorted nodes
    root.nodes = [...rootWithoutLayer.nodes, ...roots]
  }
}

const sortMediaQuery = (container: Container) => {
  const atRules: AtRule[] = []

  container.walkAtRules('media', (atRule) => {
    const query = atRule.params

    if (!atRules[query]) {
      atRules[query] = new AtRule({
        name: atRule.name,
        params: atRule.params,
        source: atRule.source,
      })
    }

    atRule.nodes.forEach((node) => {
      atRules[query].append(node.clone())
    })

    atRule.remove()
  })

  Object.keys(atRules)
    .sort(sortBy)
    .forEach((query) => {
      container.append(atRules[query])
    })
}

sortMediaQueries.postcssPlugin = 'panda-sort-mq'
