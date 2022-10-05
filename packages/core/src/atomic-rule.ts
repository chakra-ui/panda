import {
  esc,
  filterBaseConditions,
  isImportant,
  toHash,
  walkObject,
  withoutImportant,
  withoutSpace,
} from '@css-panda/shared'
import { ConditionalRule } from './conditional-rule'
import { toCss } from './to-css'
import type { Dict, GeneratorContext } from './types'

export type ProcessOptions = {
  scope?: string[]
  styles: Dict
}

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
    const { utility } = this.context

    const styleObject = utility.hasShorthand
      ? walkObject(styles, (v) => v, {
          getKey: (prop) => utility.resolveShorthand(prop),
        })
      : styles

    const rule = this.rule

    walkObject(styleObject, (value, paths) => {
      const important = isImportant(value)

      // if value doesn't exist
      if (value == null) return

      // conditions.shift was done to support condition groups
      const [prop, ...allConditions] = this.context.conditions.shift(paths)

      // remove default condition
      const conditions = filterBaseConditions(allConditions)

      // allow users transform the generated class and styles
      const transformed = this.context.transform(prop, withoutImportant(value))

      // convert css-in-js to css rule
      const cssRoot = toCss(transformed.styles, { important })

      rule.nodes = cssRoot.root.nodes

      // get the base class name
      const baseArray = [...conditions, transformed.className]

      if (scope && scope.length > 0) {
        baseArray.unshift(`[${withoutSpace(scope.join('__'))}]`)
        conditions.push(...scope)
      }

      const selector = this.hash(baseArray.join(':'))
      rule.selector = important ? `.${selector}\\!` : `.${selector}`

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
