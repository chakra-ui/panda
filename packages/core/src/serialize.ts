import { isObject, walkObject } from '@pandacss/shared'
import type { Dict } from '@pandacss/types'
import merge from 'lodash.merge'
import type { StylesheetContext } from '.'
import { parseSelectors } from './stringify'

export interface SerializeContext extends Omit<StylesheetContext, 'layers' | 'helpers' | 'hash' | 'cssVarRoot'> {}

/**
 * Transform the style object (with conditions, shorthands, tokens) into a valid CSS (in JS) object
 */
export function transformStyles(context: SerializeContext, styleObj: Dict, key: string) {
  const encoder = context.encoder.clone()
  const decoder = context.decoder.clone()

  const hashSet = new Set<string>()
  encoder.hashStyleObject(hashSet, styleObj)

  const group = decoder.getGroup(hashSet, key)

  return group.result
}

/**
 * Serialize the style object (with conditions, shorthands, tokens) into a valid CSS string
 */
export function serializeStyles(context: SerializeContext, groupedObject: Dict) {
  const result: Dict = {}

  for (const [scope, styles] of Object.entries(groupedObject)) {
    result[scope] ||= {}

    const styleObject = walkObject(styles, (value) => value, {
      getKey: (prop, value) => {
        // Rewrite html selectors to include the parent selector so that it can be parsed later on
        // ASSUMPTION: an object that has a key that is not a valid property/condition is a html selector
        // ex: 'body, :root' => '& body, & :root'
        if (isObject(value) && !context.conditions.isCondition(prop) && !context.isValidProperty(prop)) {
          const selectors = parseSelectors(prop)
          return selectors.map((s) => '& ' + s).join(', ')
        }

        return prop
      },
    })

    merge(result[scope], transformStyles(context, styleObject, scope))
  }
  return result
}
