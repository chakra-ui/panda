import { AtRule, Container, TransformCallback } from 'postcss'
import sortBy from 'sort-css-media-queries'

// sort media queries within at-rule directives or at the root
export default function sortMediaQueries(): TransformCallback {
  const inner = (root: Container) => {
    const rules = {
      unlayered: [] as Container[],
      layered: [] as AtRule[],
    }

    for (const node of root.nodes) {
      const key = node.type === 'atrule' && node.name === 'layer' ? 'layered' : 'unlayered'
      rules[key].push(node as any)
    }

    // create root for rules without layer
    const unlayeredRoot = root.clone().removeAll()
    unlayeredRoot.append(...rules.unlayered)
    sortMediaQuery(unlayeredRoot)

    const layeredRoot = root.clone().removeAll()

    for (const rule of rules.layered) {
      layeredRoot.append(...inner(rule))
    }

    // merge unlayered and layered roots
    if (layeredRoot.nodes.length) {
      unlayeredRoot.append(...layeredRoot.nodes)
    }

    // replace root nodes with sorted nodes
    return [unlayeredRoot]
  }

  return (root: Container) => {
    // @ts-expect-error
    root.nodes = inner(root)
  }
}

const sortMediaQuery = (container: Container | AtRule) => {
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
