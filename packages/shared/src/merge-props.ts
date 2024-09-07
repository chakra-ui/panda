import { isObject } from './assert'

export function mergeProps<T extends Record<string, unknown>>(...sources: T[]): T {
  return sources.reduce((prev: any, obj) => {
    if (!obj) return prev
    Object.keys(obj).forEach((key) => {
      const prevValue = prev[key]
      const value = obj[key]
      if (isObject(prevValue) && isObject(value)) {
        prev[key] = mergeProps(prevValue, value)
      } else {
        prev[key] = value
      }
    })
    return prev
  }, {} as T)
}
