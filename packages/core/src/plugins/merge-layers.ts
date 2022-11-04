import type { AtRule, TransformCallback } from 'postcss'

export default function mergeLayers(): TransformCallback {
  return (root) => {
    const layers = new Map<string, AtRule>()
    root.walkAtRules('layer', (rule) => {
      const prev = layers.get(rule.params)
      if (prev) {
        rule.remove()
        prev.append(rule.nodes)
      } else {
        layers.set(rule.params, rule)
      }
    })
  }
}

mergeLayers.postcssPlugin = 'panda-merge-layers'
