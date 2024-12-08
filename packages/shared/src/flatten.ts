import { isObject } from './assert'
import { walkObject, type WalkObjectStopFn } from './walk-object'

function filterDefault(path: string[]) {
  if (path[0] === 'DEFAULT') return path
  return path.filter((item) => item !== 'DEFAULT')
}

export function flatten(values: Record<string, Record<string, any>>, stop?: WalkObjectStopFn) {
  const result: Record<string, any> = {}

  walkObject(
    values,
    (token, paths) => {
      paths = filterDefault(paths)
      if (token) {
        result[paths.join('.')] = token.value
      }
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
