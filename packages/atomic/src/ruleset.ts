import { esc, filterBaseConditions, toHash, walkObject } from '@css-panda/shared'
import postcss, { AtRule, ChildNode, Rule } from 'postcss'
import { match } from 'ts-pattern'
import { toCss } from './to-css'
import type { Dict, GeneratorContext } from './types'

export type ProcessOptions = {
  scope?: string
  styles: Dict
}

const withoutSpace = (str: string) => str.replace(/\s/g, '_')

function expandNesting(scope: string, selector: string) {
  return scope.replace(RegExp('&', 'g'), selector)
}

type WrapOptions =
  | {
      type: 'selector'
      name: string
    }
  | {
      type: 'at-rule'
      name: string
      params: string
    }

function wrap(rule: Rule | AtRule, options: WrapOptions) {
  const parent = match(options)
    .with({ type: 'at-rule' }, ({ name, params }) => postcss.atRule({ name, params }))
    .with({ type: 'selector' }, ({ name }) => postcss.rule({ selector: name }))
    .exhaustive()

  const cloned = rule.clone()

  parent.append(cloned)
  rule.remove()

  return parent
}

type CssRule = Rule | AtRule

export function createRuleset(context: GeneratorContext, options: { hash?: boolean } = {}) {
  const { hash } = options

  let rule: CssRule | undefined
  let selector = ''

  function applyConditions(conditions: string[], rawNodes: ChildNode[]) {
    const sorted = context.conditions.sort(conditions)

    for (const cond of sorted) {
      match(cond)
        .with({ type: 'at-rule' }, (data) => {
          if (!rule) return
          rule = wrap(rule, {
            type: 'at-rule',
            name: data.name,
            params: data.value,
          })
        })
        .otherwise(() => {
          selector = expandNesting(cond.raw, selector)
          rule = postcss.rule({
            selector: selector,
            nodes: rawNodes,
          })
        })
    }
  }

  function applyHash(name: string) {
    return hash ? esc(toHash(name)) : esc(name)
  }

  function process(options: ProcessOptions) {
    const { scope, styles } = options

    walkObject(styles, (value, paths) => {
      // conditions.shift was done to support condition groups
      const [prop, ...allConditions] = context.conditions.shift(paths)

      // remove default condition
      const conditions = filterBaseConditions(allConditions)

      // allow users transform the generated class and styles
      const transformed = context.transform(prop, value)

      // convert css-in-js to css rule
      const cssRoot = toCss(transformed.styles)
      const nodes = cssRoot.root.nodes

      // get the base class name
      const baseArray = [...conditions, transformed.className]

      if (scope) {
        baseArray.unshift(`[${withoutSpace(scope)}]`)
        conditions.push(scope)
      }

      const selectorString = applyHash(baseArray.join(':'))
      selector = `.${selectorString}`

      // no empty rulesets
      if (!nodes.length) return

      rule = postcss.rule({ selector, nodes })

      // apply css conditions
      applyConditions(conditions, nodes)

      // append the rule to the root
      context.root.append(rule)
    })
  }

  return {
    process,
    toCss() {
      return context.root.toString()
    },
  }
}

export type Ruleset = ReturnType<typeof createRuleset>
