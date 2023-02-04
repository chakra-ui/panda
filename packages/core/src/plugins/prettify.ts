import type { Container, TransformCallback } from 'postcss'

function prettifyNode(node: Container, indent = 0) {
  node.each &&
    node.each((child, i) => {
      if (!child.raws.before || !child.raws.before.trim() || child.raws.before.includes('\n')) {
        child.raws.before = `\n${node.type !== 'rule' && i > 0 ? '\n' : ''}${'  '.repeat(indent)}`
      }
      prettifyNode(child as any, indent + 1)
    })
}

export default function prettify(): TransformCallback {
  return (root) => {
    prettifyNode(root)
    if (root.first) {
      root.first.raws.before = ''
    }
  }
}

prettify.postcssPlugin = 'panda-prettify'
