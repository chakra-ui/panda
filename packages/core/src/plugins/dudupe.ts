import type { Rule, TransformCallback } from 'postcss'

// write postcss plugin to remove duplicate rules
export default function dudupe(): TransformCallback {
  return (root) => {
    root.walkRules((node) => {
      const { selector, parent } = node
      const rules = parent?.nodes.filter((node) => node.type === 'rule') as Rule[]
      const duplicates = rules.filter((rule) => rule.selector === selector)
      if (duplicates.length > 1) {
        duplicates.forEach((rule, i) => {
          if (i > 0) rule.remove()
        })
      }
    })
  }
}
