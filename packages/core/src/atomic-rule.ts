import {
  esc,
  filterBaseConditions,
  isImportant,
  toHash,
  walkObject,
  withoutImportant,
  withoutSpace,
} from '@pandacss/shared'
import type { Dict } from '@pandacss/types'
import type { Root } from 'postcss'
import postcss from 'postcss'
import { toCss } from './to-css'
import type { StylesheetContext } from './types'

export type ProcessOptions = {
  scope?: string[]
  styles: Dict
}

export class AtomicRule {
  root: Root
  layer = 'utilities'
  constructor(private context: StylesheetContext) {
    this.root = postcss.root()
  }

  hash = (name: string) => {
    return this.context.hash ? esc(toHash(name)) : esc(name)
  }

  get rule() {
    return this.context.conditions.rule()
  }

  process = (options: ProcessOptions) => {
    const { scope, styles } = options
    const { utility, conditions: cond } = this.context

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
      const [prop, ...allConditions] = cond.shift(paths)

      // remove default condition
      const conditions = filterBaseConditions(allConditions)

      // allow users transform the generated class and styles
      const transformed = this.context.transform(prop, withoutImportant(value))

      // convert css-in-js to css rule
      const cssRoot = toCss(transformed.styles, { important })

      rule.nodes = cssRoot.root.nodes

      // get the base class name
      const baseArray = [...cond.finalize(conditions), transformed.className]

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
      if (transformed.layer) {
        // if layer is specified, create a new root with the layer name
        const atRule = postcss.atRule({
          name: 'layer',
          params: transformed.layer,
          nodes: [rule.rule!],
        })
        this.root.append(atRule)
        //
      } else {
        this.root.append(rule.rule!)
      }
    })

    const atRule = postcss.atRule({
      name: 'layer',
      params: this.layer,
      nodes: [this.root],
    })
    this.context.root.append(atRule)
  }

  toCss = () => {
    return this.context.root.toString()
  }
}
