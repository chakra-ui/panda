import { walkObject } from '@css-panda/walk-object'
import { CSSCondition } from './css-condition'
import { toCss } from './to-css'
import { Dict, GeneratorContext } from './types'
import postcss, { AtRule, Rule } from 'postcss'
import { match } from 'ts-pattern'

export type ProcessOptions = {
  scope?: string
  styles: Dict
}

export class AtomicRuleset {
  constructor(private context: GeneratorContext) {}

  private rule: Rule | AtRule

  wrapRule(options: WrapOptions) {
    this.rule = wrap(this.rule, options)
  }

  process(options: ProcessOptions) {
    const { scope, styles } = options

    walkObject(styles, (value, paths) => {
      let [prop, ...conditions] = paths

      // remove default condition
      conditions = filterDefaults(conditions)

      // allow users transform the generated class and styles
      const transformed = this.context.transform(prop, value)

      // convert css-in-js to css rule
      const cssRoot = toCss(transformed.styles)
      const rawNodes = cssRoot.root.nodes

      // get the base class name
      const baseArray = [...conditions, transformed.className]

      if (scope) {
        baseArray.unshift(`[${scope}]`)
        conditions.push(scope)
      }

      let currentSelector = `.${esc(baseArray.join(':'))}`

      this.rule = postcss.rule({
        selector: currentSelector,
        nodes: rawNodes,
      })

      const css = new CSSCondition(this.context.conditions)

      for (const cond of css.resolve(conditions)) {
        match(cond)
          .with({ type: 'at-rule' }, (data) => {
            this.wrapRule({
              type: 'at-rule',
              name: data.name,
              params: data.value,
            })
          })
          .otherwise(() => {
            currentSelector = expandNesting(cond.raw, currentSelector)
            this.rule = postcss.rule({
              selector: currentSelector,
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

function filterDefaults(conditions: string[]) {
  return conditions.slice().filter((v) => !/^(DEFAULT|_)$/.test(v))
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

function esc(str: string) {
  return str.replace(/[.*+?&:^>_${}()|[\]\\]/g, '\\$&')
}
