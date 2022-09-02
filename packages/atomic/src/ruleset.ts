import { walkObject } from '@css-panda/walk-object'
import postcss, { AtRule, Rule } from 'postcss'
import { match } from 'ts-pattern'
import { esc } from './esc'
import { filterDefaults } from './filter-defaults'
import { toHash } from './hash'
import { toCss } from './to-css'
import { Dict, GeneratorContext } from './types'

export type ProcessOptions = {
  scope?: string
  styles: Dict
}

export class Ruleset {
  hash: boolean

  constructor(private context: GeneratorContext, options: { hash?: boolean } = {}) {
    this.hash = !!options.hash
  }

  private rule: Rule | AtRule | undefined
  private selector = ''

  wrapRule(options: WrapOptions) {
    if (!this.rule) return
    this.rule = wrap(this.rule, options)
  }

  process(options: ProcessOptions) {
    const { scope, styles } = options

    walkObject(styles, (value, paths) => {
      const [prop, ..._conditions] = paths

      // remove default condition
      const conditions = filterDefaults(_conditions)

      // allow users transform the generated class and styles
      const transformed = this.context.transform(prop, value)

      // convert css-in-js to css rule
      const cssRoot = toCss(transformed.styles)
      const rawNodes = cssRoot.root.nodes

      // get the base class name
      const baseArray = [...conditions, transformed.className]

      if (scope) {
        baseArray.unshift(`[${scope.replaceAll(' ', '_')}]`)
        conditions.push(scope)
      }

      const selectorString = this.hash ? esc(toHash(baseArray.join(':'))) : esc(baseArray.join(':'))
      this.selector = `.${selectorString}`

      // no empty rulesets
      if (!rawNodes.length) return

      this.rule = postcss.rule({
        selector: this.selector,
        nodes: rawNodes,
      })

      const sortedConditions = this.context.conditions.sort(conditions)

      for (const cond of sortedConditions) {
        match(cond)
          .with({ type: 'at-rule' }, (data) => {
            this.wrapRule({
              type: 'at-rule',
              name: data.name,
              params: data.value,
            })
          })
          .otherwise(() => {
            this.selector = expandNesting(cond.raw, this.selector)
            this.rule = postcss.rule({
              selector: this.selector,
              nodes: rawNodes,
            })
          })
      }

      this.context.root.append(this.rule)
    })

    return this
  }

  toCss() {
    return this.context.root.toString()
  }
}

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
