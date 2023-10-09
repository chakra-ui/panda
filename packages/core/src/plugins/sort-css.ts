import type { ChildNode, Container, Node, Rule, TransformCallback } from 'postcss'

const styleOrder = [':link', ':visited', ':focus-within', ':focus', ':focus-visible', ':hover', ':active']

const pseudoSelectorScore = (selector: string) => {
  const index = styleOrder.findIndex((pseudoClass) => selector.trim().includes(pseudoClass))
  return index + 1
}

export default function sortCss(): TransformCallback {
  const inner = (root: Container) => {
    const catchAll: Node[] = []
    const rules: Rule[] = []
    const atRules: Node[] = []

    root.each((node) => {
      switch (node.type) {
        case 'rule': {
          if (node.first?.type === 'atrule') {
            atRules.push(node)
          } else {
            rules.push(node)
          }

          break
        }

        case 'atrule': {
          atRules.push(node)
          break
        }

        default: {
          catchAll.push(node)
        }
      }
    })

    rules.sort((rule1, rule2) => {
      // console.log(rule1.selectors, rule2.selectors)
      const selector1 = rule1.selectors.length ? rule1.selectors[0] : rule1.selector
      const selector2 = rule2.selectors.length ? rule2.selectors[0] : rule2.selector
      return pseudoSelectorScore(selector1) - pseudoSelectorScore(selector2)
    })

    root.nodes = [...catchAll, ...rules, ...atRules] as ChildNode[]

    root.nodes.forEach((node) => {
      if ('nodes' in node) {
        inner(node)
      }
    })
  }

  return inner
}

sortCss.postcssPlugin = 'panda-sort-css'
