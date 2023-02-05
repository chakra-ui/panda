import { expandNestedCss, extractParentSelectors, prettifyCss, toCss } from '@pandacss/core'
import postcss, { AtRule, Rule } from 'postcss'
import type { Context } from '../../engines'

export function generateTokenCss(ctx: Context) {
  const {
    config: { cssVarRoot },
    conditions,
    tokens,
  } = ctx

  const root = cssVarRoot!

  const results: string[] = []

  for (const [key, values] of tokens.vars.entries()) {
    const varsObj = Object.fromEntries(values)
    if (Object.keys(varsObj).length === 0) continue

    if (key === 'base') {
      const { css } = toCss({ [root]: varsObj })
      results.push(css)
    } else {
      // nested conditionals in semantic tokens are joined by ":", so let's split it
      const keys = key.split(':')
      const { css } = toCss(varsObj)

      const mapped = keys
        .map((key) => conditions.get(key))
        .filter(Boolean)
        .map((condition) => {
          const parent = extractParentSelectors(condition)
          // ASSUMPTION: the nature of parent selectors with tokens is that they're merged
          // [data-color-mode=dark][data-theme=pastel]
          // If we really want it nested, we remove the `&`
          return parent ? `&${parent}` : condition
        })

      const rule = getDeepestRule(root, mapped)
      if (!rule) continue

      getDeepestNode(rule)?.append(css)
      results.push(expandNestedCss(rule.toString()))
    }
  }

  const css = results.join('\n\n')

  return `@layer tokens {
    ${prettifyCss(cleanupSelectors(css, root))}
  }
  `
}

function getDeepestRule(root: string, selectors: string[]) {
  const rule = postcss.rule({ selector: '' })

  for (const selector of selectors) {
    const last = getDeepestNode(rule)
    const node = last ?? rule
    if (selector.startsWith('@')) {
      // ASSUMPTION: the nature of parent selectors with tokens is that they're merged
      // [data-color-mode=dark][data-theme=pastel]
      // If we really want it nested, we remove the `&`
      const atRule = postcss.rule({ selector, nodes: [postcss.rule({ selector: `${root}&` })] })
      node.append(atRule)
    } else {
      node.append(postcss.rule({ selector }))
    }
  }

  return rule
}

function getDeepestNode(node: AtRule | Rule): Rule | AtRule | undefined {
  if (node.nodes && node.nodes.length) {
    return getDeepestNode(node.nodes[node.nodes.length - 1] as AtRule | Rule)
  }
  return node
}

function cleanupSelectors(css: string, varSelector: string) {
  const root = postcss.parse(css)

  root.walkRules((rule) => {
    rule.selectors.forEach((selector) => {
      const res = selector.split(varSelector).filter(Boolean)
      if (res.length === 0) return
      rule.selector = res.join(varSelector)
    })
  })

  return root.toString()
}
