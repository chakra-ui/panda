import { Stylesheet, expandNestedCss, extractParentSelectors, stringify } from '@pandacss/core'
import postcss, { AtRule, CssSyntaxError, Rule } from 'postcss'
import type { Context } from '@pandacss/core'
import { logger } from '@pandacss/logger'

export function generateTokenCss(ctx: Context, sheet: Stylesheet) {
  const {
    config: { cssVarRoot },
    conditions,
    tokens,
  } = ctx

  const root = cssVarRoot!

  const results: string[] = []
  const vars = new Map(tokens.view.vars.entries())

  const cssVars = ctx.config.cssVars ?? {}
  const cssCustomProps = [] as string[]
  if (!vars.has('base')) {
    vars.set('base', new Map())
  }
  const base = vars.get('base')!

  Object.entries(cssVars).forEach(([key, value]) => {
    if (typeof value === 'string') {
      base.set(key, value)
      return
    }

    const css = `@property ${key} {
          syntax: '${value.syntax}';
          inherits: ${value.inherits};
          initial-value: ${value.initialValue};
        }`
    cssCustomProps.push(css)
  })

  for (const [key, values] of vars.entries()) {
    const varsObj = Object.fromEntries(values)
    if (Object.keys(varsObj).length === 0) continue

    if (key === 'base') {
      const css = stringify({ [root]: varsObj })
      results.push(css)

      // Append CSS properties right after the root
      results.push(cssCustomProps.join('\n'))
    } else {
      // nested conditionals in semantic tokens are joined by ":", so let's split it
      const keys = key.split(':')
      const css = stringify(varsObj)

      const mapped = keys
        .map((key) => conditions.get(key))
        .filter(Boolean)
        .map((condition) => {
          const lastSegment = Array.isArray(condition) ? condition.at(-1)! : condition
          if (!lastSegment) return
          const parent = extractParentSelectors(lastSegment)
          // ASSUMPTION: the nature of parent selectors with tokens is that they're merged
          // [data-color-mode=dark][data-theme=pastel]
          // If we really want it nested, we remove the `&`
          return parent ? `&${parent}` : lastSegment
        })
        .filter(Boolean)

      if (!mapped.length) return

      const rule = getDeepestRule(root, mapped as string[])
      if (!rule) continue

      getDeepestNode(rule)?.append(css)
      results.push(expandNestedCss(rule.toString()))
    }
  }

  let css = results.join('\n\n')
  css = '\n\n' + cleanupSelectors(css, root)

  if (ctx.hooks['cssgen:done']) {
    css = ctx.hooks['cssgen:done']({ artifact: 'tokens', content: css }) ?? css
  }

  sheet.layers.tokens.append(css)
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

const parse = (str: string) => {
  try {
    return postcss.parse(str)
  } catch (error) {
    if (error instanceof CssSyntaxError) {
      logger.error('tokens:process', error.showSourceCode(true))
    }
  }
}

export function cleanupSelectors(css: string, varSelector: string) {
  // Ignore if invalid CSS
  const root = parse(css) ?? postcss.root()

  root.walkRules((rule) => {
    // [':root', ' :host,', '  ::backdrop ']
    const selectors = [] as string[]
    rule.selectors.forEach((selector) => {
      selectors.push(selector.trim())
    })

    // ':root, :host, ::backdrop'
    const ruleSelector = selectors.join(', ')
    if (ruleSelector === varSelector) {
      return
    }

    // ':root,:host,::backdrop'
    const trimmedSelector = selectors.join(',')
    if (trimmedSelector === varSelector) {
      return
    }

    const selectorsWithoutVarRoot = selectors
      .map((selector) => {
        const res = selector.split(varSelector).filter(Boolean)
        return res.join('')
      })
      .filter(Boolean)
    if (selectorsWithoutVarRoot.length === 0) return
    rule.selector = selectorsWithoutVarRoot.join(', ')
  })

  return root.toString()
}
