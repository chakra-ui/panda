import { isObject } from './assert'
import { compact } from './compact'
import { filterBaseConditions } from './condition'
import { toHash } from './hash'
import { isImportant, withoutImportant } from './important'
import { memo } from './memo'
import { mergeProps } from './merge-props'
import { normalizeStyleObject } from './normalize-style-object'
import { walkObject } from './walk-object'

export interface CreateCssContext {
  hash?: boolean
  /**
   * Partial properties from the Utility class
   */
  utility: {
    prefix: string
    hasShorthand: boolean
    resolveShorthand: (prop: string) => string
    transform: (prop: string, value: any) => { className: string }
    toHash: (path: string[], toHash: (str: string) => string) => string
  }
  /**
   * Partial properties from the Condition class
   */
  conditions?: {
    breakpoints: { keys: string[] }
    shift: (paths: string[]) => string[]
    finalize: (paths: string[]) => string[]
  }
}

const fallbackCondition: NonNullable<CreateCssContext['conditions']> = {
  shift: (v) => v,
  finalize: (v) => v,
  breakpoints: { keys: [] },
}

const sanitize = (value: any) => (typeof value === 'string' ? value.replaceAll(/[\n\s]+/g, ' ') : value)

export function createCss(context: CreateCssContext) {
  const { utility, hash, conditions: conds = fallbackCondition } = context

  const formatClassName = (str: string) => [utility.prefix, str].filter(Boolean).join('-')

  const hashFn = (conditions: string[], className: string) => {
    let result: string
    if (hash) {
      const baseArray = [...conds.finalize(conditions), className]
      result = formatClassName(utility.toHash(baseArray, toHash))
    } else {
      const baseArray = [...conds.finalize(conditions), formatClassName(className)]
      result = baseArray.join(':')
    }
    return result
  }

  return memo(({ base, ...styles }: Record<string, any> = {}) => {
    const styleObject = Object.assign(styles, base)
    const normalizedObject = normalizeStyleObject(styleObject, context)
    const classNames = new Set<string>()

    walkObject(normalizedObject, (value, paths) => {
      const important = isImportant(value)

      if (value == null) return

      const [prop, ...allConditions] = conds.shift(paths)
      const conditions = filterBaseConditions(allConditions)

      const transformed = utility.transform(prop, withoutImportant(sanitize(value)))

      let className = hashFn(conditions, transformed.className)
      if (important) className = `${className}!`

      classNames.add(className)
    })

    return Array.from(classNames).join(' ')
  })
}

interface StyleObject {
  [key: string]: any
}

function compactStyles(...styles: StyleObject[]) {
  return styles.flat().filter((style) => isObject(style) && Object.keys(compact(style)).length > 0)
}

export function createMergeCss(context: CreateCssContext) {
  function resolve(styles: StyleObject[]) {
    const allStyles = compactStyles(...styles)
    if (allStyles.length === 1) return allStyles
    return allStyles.map((style) => normalizeStyleObject(style, context))
  }

  function mergeCss(...styles: StyleObject[]) {
    return mergeProps(...resolve(styles))
  }

  function assignCss(...styles: StyleObject[]) {
    return Object.assign({}, ...resolve(styles))
  }

  return { mergeCss: memo(mergeCss), assignCss }
}
