import { isObject } from './assert'

export function deepMerge<T extends Record<string, unknown>>(...sources: T[]): T {
  const allSources = sources.filter(isObject)

  if (allSources.length === 1) {
    return allSources[0]
  }

  const result = {} as any

  for (const source of allSources) {
    for (const [key, value] of Object.entries(source)) {
      if (isObject(value)) {
        result[key] = deepMerge(result[key] || {}, value)
      } else {
        result[key] = value
      }
    }
  }

  return result
}
