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
import type { ConditionalRule } from './conditional-rule'

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

  groupedHashFn = (styles: Dict, classList: string) => {
    const className = this.context.hash ? toHash(JSON.stringify(styles)) : classList
    const result = this.context.utility.formatClassName(className)
    return esc(result)
  }

  hashFn = (conditions: string[], className: string) => {
    const { conditions: cond, utility } = this.context
    const baseArray = [...cond.finalize(conditions), utility.formatClassName(className)]
    const result = baseArray.join(':')
    return result
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

    const rule = postcss.rule()
    const classList = [] as string[]
    const rulesToUpdate = [] as Array<[ConditionalRule, conditions: string[]]>

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

      classList.push(this.hashFn(conditions, transformed.className))

      // convert css-in-js to css rule
      const cssRoot = toCss(transformed.styles, { important })

      const decl = cssRoot.root.nodes

      if (conditions.length === 0) {
        rule.append(decl)
      } else {
        const condRule = this.context.conditions.rule()
        const clone = [...decl]

        condRule.nodes = clone

        rulesToUpdate.push([condRule, conditions])
      }
    })

    rule.selector = `.${this.groupedHashFn(styleObject, Array.from(classList).join('__'))}`
    rulesToUpdate.forEach(([condRule, conditions]) => {
      condRule.selector = rule.selector
      condRule.update()

      // apply css conditions
      condRule.applyConditions(conditions)

      this.root.append(condRule.rule!)
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
