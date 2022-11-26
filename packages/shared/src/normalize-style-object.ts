import { walkObject } from './walk-object'
import type { CreateCssContext } from './classname'

type NormalizeContext = Pick<CreateCssContext, 'hasShorthand' | 'resolveShorthand' | 'conditions'>

function toResponsiveObject(values: string[], breakpoints: string[]) {
  return values.reduce((acc, current, index) => {
    const key = breakpoints[index]
    if (current != null) {
      acc[key] = current
    }
    return acc
  }, {})
}

export function normalizeStyleObject(styles: Record<string, any>, context: NormalizeContext) {
  const { hasShorthand, resolveShorthand, conditions } = context

  return walkObject(
    styles,
    (value) => {
      return Array.isArray(value) ? toResponsiveObject(value, conditions!.breakpoints.keys) : value
    },
    {
      stop: (value) => Array.isArray(value),
      getKey: (prop) => {
        return hasShorthand ? resolveShorthand(prop) : prop
      },
    },
  )
}
