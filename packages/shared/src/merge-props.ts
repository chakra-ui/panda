import { isObject } from './assert'

export function mergeProps<T extends Record<string, unknown>>(...sources: T[]): T {
  const __sources = sources.filter(Boolean)
  const result = {} as Record<string, any>
  for (const source of __sources) {
    for (const [key, value] of Object.entries(source)) {
      if (isObject(value)) {
        result[key] = mergeProps(result[key] || {}, value)
      } else {
        result[key] = value
      }
    }
  }
  return result as T
}
