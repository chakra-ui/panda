import type { Config } from '@pandacss/types'

export type Dict = Record<string, any>
export type Extendable<T> = T & { extend?: T }
export type ExtendableConfig = Extendable<Config>

export const omitKeys = new Set(['__proto__', 'constructor', 'prototype'])

export function isPlainObject(value: unknown): value is Dict {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

export function clone<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => clone(item)) as T

  if (isPlainObject(value)) {
    const result: Dict = {}
    for (const [key, item] of Object.entries(value)) {
      if (item !== undefined && !omitKeys.has(key)) result[key] = clone(item)
    }
    return result as T
  }

  return value
}
