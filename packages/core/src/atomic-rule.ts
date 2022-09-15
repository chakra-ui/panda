import { esc, filterBaseConditions, toHash, walkObject } from '@css-panda/shared'
import { ConditionalRule } from './conditional-rule'
import { toCss } from './to-css'
import type { Dict, GeneratorContext } from './types'

export type ProcessOptions = {
  scope?: string
  styles: Dict
}

const withoutSpace = (str: string) => str.replace(/\s/g, '_')

export class AtomicRule {
  constructor(private context: GeneratorContext) {}

  hash = (name: string) => {
    return this.context.hash ? esc(toHash(name)) : esc(name)
  }

  get rule() {
    return new ConditionalRule(this.context.conditions)
  }

  process = (options: ProcessOptions) => {
    const { scope, styles } = options

    const rule = this.rule

    walkObject(styles, (value, paths) => {
      // if value doesn't exist
      if (value == null) return

      // conditions.shift was done to support condition groups
      const [prop, ...allConditions] = this.context.conditions.shift(paths)

      // remove default condition
      const conditions = filterBaseConditions(allConditions)

      // allow users transform the generated class and styles
      const transformed = this.context.transform(prop, value)

      // convert css-in-js to css rule
      const cssRoot = toCss(transformed.styles)
      rule.nodes = cssRoot.root.nodes

      // get the base class name
      const baseArray = [...conditions, transformed.className]

      if (scope) {
        baseArray.unshift(`[${withoutSpace(scope)}]`)
        conditions.push(scope)
      }

      const selectorString = this.hash(baseArray.join(':'))
      rule.selector = `.${selectorString}`

      // no empty rulesets
      if (rule.isEmpty) return

      rule.update()

      // apply css conditions
      rule.applyConditions(conditions)

      // append the rule to the root
      this.context.root.append(rule.rule!)
    })
  }

  toCss = () => {
    return this.context.root.toString()
  }
}
