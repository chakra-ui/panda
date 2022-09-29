import { walkObject } from '@css-panda/shared'
import type { Dict } from '@css-panda/types'

export function getTokenMap(values: Dict = {}) {
  const map = new Map<string, string>()

  walkObject(
    values,
    function resolve(value, path) {
      map.set(path.join('.'), value)
    },
    {
      stop(value) {
        return Array.isArray(value)
      },
    },
  )

  return map
}

export function getSemanticTokenMap(values: Dict = {}) {
  const map = new Map<string, Map<string, string>>()

  walkObject(
    values,
    function resolve(value, path) {
      const condition = path.pop()!
      const key = path.join('.')

      const isDefault = condition === '_' || condition === 'base'

      const prop = isDefault ? 'base' : condition

      if (!map.has(prop)) {
        map.set(prop, new Map())
      }

      map.get(prop)?.set(key, value)
    },
    {
      stop(value) {
        return Array.isArray(value)
      },
    },
  )

  return map
}
