import { isImportant, isObject, withoutImportant } from '@css-panda/shared'
import type { Dict } from '@css-panda/types'
import merge from 'lodash.merge'
import type { Conditions } from './conditions'
import { addImportant, toCss } from './to-css'
import type { Utility } from './utility'

type IterFn = (key: string, value: any, path: string[]) => Dict

function walk(obj: Dict, fn: IterFn, getKey: (v: string) => string, path: string[] = []): Dict {
  const result: Dict = {}

  for (const [key, value] of Object.entries(obj)) {
    const nextPath = [...path, key]
    if (isObject(value)) {
      merge(result, { [getKey(key)]: walk(value, fn, getKey, nextPath) })
    } else {
      merge(result, fn(key, value, nextPath))
    }
  }

  return result
}

export function serializeStyles(obj: Dict, context: { conditions: Conditions; utility: Utility }) {
  const { conditions, utility } = context

  const iterFn = (key: string, value: any) => {
    const important = isImportant(value)
    let { styles } = utility.resolve(key, withoutImportant(value))
    if (important) {
      styles = addImportant(styles)
    }
    return styles
  }

  const output = walk(obj, iterFn, (key) => conditions.get(key) ?? key)

  return toCss(output).root
}
