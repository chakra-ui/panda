import { isObject, isString } from './assert'

const MERGE_OMIT = new Set(['__proto__', 'constructor', 'prototype'])

export function mergeWith(target: any, ...sources: any[]) {
  const customizer = sources.pop()

  for (const source of sources) {
    for (const key in source) {
      if (isString(key) && MERGE_OMIT.has(key)) continue
      const merged = customizer(target[key], source[key])
      if (merged === undefined) {
        if (isObject(target[key]) && isObject(source[key])) {
          target[key] = mergeWith({}, target[key], source[key], customizer)
        } else {
          target[key] = source[key]
        }
      } else {
        target[key] = merged
      }
    }
  }

  return target
}
