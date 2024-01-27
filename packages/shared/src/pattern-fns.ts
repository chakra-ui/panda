import { compact } from './compact'
import { isCssFunction } from './is-css-function'
import { isCssUnit } from './is-css-unit'
import { isCssVar } from './is-css-var'
import { mapObject } from './walk-object'

export const patternFns = {
  map: mapObject,
  isCssFunction,
  isCssVar,
  isCssUnit,
}

export const getPatternStyles = (pattern: any, styles: Record<string, any>) => {
  if (!pattern.defaultValues) return styles
  const defaults = typeof pattern.defaultValues === 'function' ? pattern.defaultValues(styles) : pattern.defaultValues
  return Object.assign({}, defaults, compact(styles))
}
