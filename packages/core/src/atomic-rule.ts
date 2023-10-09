import {
  esc,
  filterBaseConditions,
  isImportant,
  normalizeStyleObject,
  toHash,
  walkObject,
  withoutImportant,
} from '@pandacss/shared'
import type { Dict } from '@pandacss/types'
import type { Root } from 'postcss'
import postcss from 'postcss'
import { toCss } from './to-css'
import type { StylesheetContext } from './types'

export type ProcessOptions = {
  styles: Dict
}

export class AtomicRule {
  root: Root
  layer: string

  constructor(private context: StylesheetContext) {
    this.root = postcss.root()
    this.layer = context.layers.utilities
  }

  hashFn = (conditions: string[], className: string) => {
    const { conditions: cond, hash, utility } = this.context
    let result: string
    if (hash) {
      const baseArray = [...cond.finalize(conditions), className]
      result = utility.formatClassName(toHash(baseArray.join(':')))
    } else {
      const baseArray = [...cond.finalize(conditions), utility.formatClassName(className)]
      result = baseArray.join(':')
    }
    return esc(result)
  }

  get rule() {
    return this.context.conditions.rule()
  }

  get transform() {
    return this.context?.transform ?? this.context.utility.transform
  }

  process = (options: ProcessOptions) => {
    const { styles } = options
    const { conditions: cond } = this.context

    const styleObject = normalizeStyleObject(styles, this.context)
    // shouldn't happen, but just in case
    if (typeof styleObject !== 'object') return

    const rule = this.rule

    // console.log(styleObject)
    walkObject(styleObject, (value, paths) => {
      // if value doesn't exist
      if (value == null) return

      // console.log({ value, paths })
      // TODO skip paths+value if seen before

      const important = isImportant(value)

      // conditions.shift was done to support condition groups
      const [prop, ...allConditions] = cond.shift(paths)

      // remove default condition
      const conditions = filterBaseConditions(allConditions)

      // allow users transform the generated class and styles
      const transformed = this.transform(prop, withoutImportant(value))
      // console.log({ value, paths, prop, conditions, transformed })

      // convert css-in-js to css rule
      const cssRoot = toCss(transformed.styles, { important })

      rule.nodes = cssRoot.root.nodes as postcss.ChildNode[]

      // no empty rulesets
      if (rule.isEmpty) return

      const selector = this.hashFn(conditions, transformed.className)

      rule.selector = important ? `.${selector}\\!` : `.${selector}`

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

    if (this.root.nodes.length === 0) return

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
