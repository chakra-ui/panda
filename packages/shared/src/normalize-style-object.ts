import type { CreateCssContext } from './classname'
import { walkObject } from './walk-object'

type NormalizeContext = Pick<CreateCssContext, 'utility' | 'conditions'>

function toResponsiveObject(values: string[], breakpoints: string[]) {
  return values.reduce((acc, current, index) => {
    const key = breakpoints[index]
    if (current != null) {
      acc[key] = current
    }
    return acc
  }, {} as Record<string, string>)
}

export function normalizeShorthand(styles: Record<string, any>, context: NormalizeContext) {
  const { hasShorthand, resolveShorthand } = context.utility
  return walkObject(styles, (v) => v, {
    getKey: (prop) => {
      return hasShorthand ? resolveShorthand(prop) : prop
    },
  })
}

export function normalizeStyleObject(styles: Record<string, any>, context: NormalizeContext, shorthand = true) {
  const { utility, conditions } = context
  const { hasShorthand, resolveShorthand } = utility

  return walkObject(
    styles,
    (value) => {
      return Array.isArray(value) ? toResponsiveObject(value, conditions!.breakpoints.keys) : value
    },
    {
      stop: (value) => Array.isArray(value),
      getKey: shorthand ? (prop) => (hasShorthand ? resolveShorthand(prop) : prop) : undefined,
    },
  )
}
