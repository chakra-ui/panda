import { isObject } from './assert'
import { walkObject, WalkObjectStopFn } from './walk-object'

export function flatten(values: Record<string, Record<string, any>>, stop?: WalkObjectStopFn) {
  const result: Record<string, any> = {}

  walkObject(
    values,
    (token, paths) => {
      result[paths.join('.')] = token.value
    },
    {
      stop:
        stop ??
        ((v) => {
          return isObject(v) && 'value' in v
        }),
    },
  )

  return result
}
