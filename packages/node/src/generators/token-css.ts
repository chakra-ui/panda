import { expandNestedCss, extractParentSelectors, prettifyCss, toCss, toKeyframeCss } from '@pandacss/core'
import postcss, { AtRule, Rule } from 'postcss'
import type { PandaContext } from '../context'

export function generateKeyframes(keyframes: Record<string, any> | undefined) {
  if (!keyframes) return
  return toKeyframeCss(keyframes)
}

export function generateTokenCss(ctx: PandaContext, varRoot?: string) {
  const root = varRoot ?? ctx.cssVarRoot
  const conditions = ctx.conditions

  const results: string[] = []

  for (const [key, values] of ctx.tokens.vars.entries()) {
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
