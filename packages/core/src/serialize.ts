import { filterBaseConditions, isImportant, walkObject, withoutImportant } from '@css-panda/shared'
import type { Dict } from '@css-panda/types'
import merge from 'lodash.merge'
import type { Conditions } from './conditions'
import { cssToJs, toCss } from './to-css'
import type { Utility } from './utility'

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

    let { styles } = utility.resolve(prop, withoutImportant(value))

    const cssResult = toCss(styles, { important })

    if (hasConditions) {
      rule.nodes = cssResult.root.nodes
      rule.selector = `&`
      rule.update()
      rule.applyConditions(conds)
      styles = cssToJs(rule.toString())
    } else {
      styles = cssToJs(cssResult.css)
    }

    merge(result, styles)
  })

  return result
}

export function serializeStyles(
  groupedObject: Dict,
  context: {
    conditions: Conditions
    utility: Utility
  },
) {
  const result: Dict = {}
  for (const [scope, styles] of Object.entries(groupedObject)) {
    result[scope] ||= {}
    merge(result[scope], serializeStyle(styles, context))
  }
  return toCss(result).root
}
