import { walkObject } from './walk-object'
import type { CreateCssContext } from './classname'

function sortBreakpoints(breakpoints: Record<string, string>) {
  return Object.entries(breakpoints).sort(([, minA], [, minB]) => {
    return parseInt(minA, 10) < parseInt(minB, 10) ? -1 : 1
  })
}

function sortBreakpointKeys(breakpoints: Record<string, string>) {
  const breakpointKeys = sortBreakpoints(breakpoints).map(([key]) => key)

  // add base breakpoint
  breakpointKeys.unshift('base')
  return breakpointKeys
}

type NormalizeStyleObjectOptions = Pick<CreateCssContext, 'hasShorthand' | 'resolveShorthand' | 'breakpoints'>

export function normalizeStyleObject(styles: Record<string, any>, context: NormalizeStyleObjectOptions) {
  const { hasShorthand, resolveShorthand, breakpoints = {} } = context

  const breakpointKeys = sortBreakpointKeys(breakpoints)

  return walkObject(
    styles,
    (value) => {
      if (Array.isArray(value)) {
        // convert responsive array notation to object notation
        return value.reduce((prevValue, currentValue, index) => {
          const key = breakpointKeys[index]
          if (currentValue != null) {
            prevValue[key] = currentValue
          }
          return prevValue
        }, {})
      }
      return value
    },
    {
      stop: (value) => Array.isArray(value),
      getKey: (prop) => {
        if (hasShorthand) {
          return resolveShorthand(prop)
        }
        return prop
      },
    },
  )
}
