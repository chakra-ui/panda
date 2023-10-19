import { filterBaseConditions, isImportant, markImportant, walkObject, withoutImportant } from '@pandacss/shared'
import type { Dict } from '@pandacss/types'
import merge from 'lodash.merge'
import type { Conditions } from './conditions'
import { cssToJs, toCss } from './to-css'
import type { Utility } from './utility'
import type postcss from 'postcss'

export type SerializeContext = {
  conditions: Conditions
  utility: Utility
}

export function serializeStyle(styleObj: Dict, context: SerializeContext) {
  const { utility, conditions } = context
  const rule = conditions.rule()

  const result: Dict = {}

  walkObject(styleObj, (value, paths) => {
    const important = isImportant(value)

    const [prop, ...allConditions] = conditions.shift(paths)

    const conds = filterBaseConditions(allConditions)
    const hasConditions = conds.length > 0

    let { styles } = utility.transform(prop, withoutImportant(value))
    // todo use markImportant on styles
    // TODO bench
    const cssResult = toCss(important ? markImportant(styles) : styles)

    if (hasConditions) {
      /**
       * Conditions can sometimes include an at-rule and then a selector.
       * In this case, we need to split the conditions into two parts.
       * The first part is the at-rule, and the second part is the selector.
       *
       * !!NOTE: The selector segment can only contain one selector.
       */
      const segments = conditions.segment(conds)

      rule.nodes = cssResult.root.nodes as postcss.ChildNode[]
      rule.selector = segments.selector.length > 0 ? segments.selector[0] : '&'

      rule.update()
      rule.applyConditions(segments.condition)

      styles = cssToJs(rule.toString())
    } else {
      styles = cssToJs(cssResult.css)
    }

    merge(result, styles)
  })

  return result
}

export function serializeStyles(groupedObject: Dict, context: SerializeContext) {
  const result: Dict = {}
  for (const [scope, styles] of Object.entries(groupedObject)) {
    result[scope] ||= {}
    merge(result[scope], serializeStyle(styles, context))
  }
  return toCss(result).root
}
