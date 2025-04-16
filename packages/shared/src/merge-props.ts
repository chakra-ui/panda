import { isObject } from './assert'

const MERGE_OMIT = new Set(['__proto__', 'constructor', 'prototype'])

export function mergeProps<T extends Record<string, unknown>>(...sources: T[]): T {
  return sources.reduce((prev: any, obj) => {
    if (!obj) return prev
    Object.keys(obj).forEach((key) => {
      if (MERGE_OMIT.has(key)) return
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
