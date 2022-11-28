import { isImportant, withoutImportant, withoutSpace } from './css-important'
import { filterBaseConditions } from './condition'
import { toHash } from './hash'
import { walkObject } from './walk-object'
import { walkStyles } from './walk-styles'
import { normalizeStyleObject } from './normalize-style-object'

export type CreateCssContext = {
  hash?: boolean
  /**
   * Partial properties from the Utility class
   */
  utility: {
    hasShorthand: boolean
    resolveShorthand: (prop: string) => string
    transform: (prop: string, value: any) => { className: string }
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

export function createCss(context: CreateCssContext) {
  const { utility, hash, conditions: conds = fallbackCondition } = context

  return (styleObject: Record<string, any> = {}) => {
    const normalizedObject = normalizeStyleObject(styleObject, context)

    const classNames = new Set<string>()

    walkStyles(normalizedObject, (props: Record<string, any>, scope?: string[]) => {
      walkObject(props, (value, paths) => {
        const important = isImportant(value)

        if (value == null) return

        const [prop, ...allConditions] = conds.shift(paths)

        const conditions = filterBaseConditions(allConditions)
        const transformed = utility.transform(prop, withoutImportant(value))
        let transformedClassName = transformed.className

        if (important) {
          transformedClassName = `${transformedClassName}!`
        }

        // get the base class name
        const baseArray = [...conds.finalize(conditions), transformedClassName]

        if (scope && scope.length > 0) {
          baseArray.unshift(`[${withoutSpace(scope.join('__'))}]`)
        }

        const className = hash ? toHash(baseArray.join(':')) : baseArray.join(':')
        classNames.add(className)
      })
    })

    return Array.from(classNames).join(' ')
  }
}
