import type { Container, TransformCallback } from 'postcss'

export const prettify = (): TransformCallback => {
  return (root) => {
    function indentRecursive(node: Container, indent = 0) {
      node.each &&
        node.each((child, i) => {
          if (!child.raws.before || !child.raws.before.trim() || child.raws.before.includes('\n')) {
            child.raws.before = `\n${node.type !== 'rule' && i > 0 ? '\n' : ''}${'  '.repeat(indent)}`
          }
          child.raws.after = `\n${'  '.repeat(indent)}`
          indentRecursive(child as any, indent + 1)
        })
    }

    indentRecursive(root)
    if (root.first) {
      root.first.raws.before = ''
    }
  }
}
