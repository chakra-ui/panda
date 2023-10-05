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
import postcss from 'postcss'
import type { StylesheetContext } from './types'
import { toCss } from './to-css'

export interface ProcessOptions {
  styles: Dict
}

export class GroupedRule {
  root: postcss.Root
  layer: string

  constructor(private context: StylesheetContext) {
    this.root = postcss.root()
    this.layer = context.layers.utilities
  }

  hashFn = (styles: Dict) => {
    const result = this.context.utility.formatClassName(toHash(JSON.stringify(styles)))
    return esc(result)
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

    const className = `.${this.hashFn(styleObject)}`
    const rule = postcss.rule({ selector: className })

    walkObject(styleObject, (value, paths) => {
      // if value doesn't exist
      if (value == null) return

      const important = isImportant(value)

      // conditions.shift was done to support condition groups
      const [prop, ...allConditions] = cond.shift(paths)

      // remove default condition
      const conditions = filterBaseConditions(allConditions)

      // allow users transform the generated class and styles
      const transformed = this.transform(prop, withoutImportant(value))

      // convert css-in-js to css rule
      const cssRoot = toCss(transformed.styles, { important })

      const decl = cssRoot.root.nodes

      if (conditions.length === 0) {
        rule.append(decl)
      } else {
        const condRule = this.context.conditions.rule()

        condRule.nodes = decl
        condRule.selector = className
        condRule.update()

        // apply css conditions
        condRule.applyConditions(conditions)

        this.root.append(condRule.rule!)
      }
    })

    if (rule.nodes.length > 0) {
      this.root.append(rule)
    }

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
