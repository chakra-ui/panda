import type { Config } from '@pandacss/types'
import { PandaError } from './error'

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
  // Direct loops over `Object.keys` instead of entries/map, which allocates
  // intermediate arrays (plus a [key, value] tuple per property) per node.
  if (Array.isArray(value)) {
    const len = value.length
    const out = new Array(len)
    for (let i = 0; i < len; i++) out[i] = clone(value[i])
    return out as T
  }

  if (!isPlainObject(value)) return value

  const source = value as Dict
  const out: Dict = {}
  const keys = Object.keys(source)
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]!
    if (omitKeys.has(key)) continue
    const item = source[key]
    if (item !== undefined) out[key] = clone(item)
  }
  return out as T
}

export function ensureConfigObject(config: unknown, name: string): ExtendableConfig {
  if (isPlainObject(config)) return config as ExtendableConfig
  throw new PandaError('CONFIG_ERROR', `💥 Preset ${JSON.stringify(name)} must resolve to an object.`)
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** Drop keys whose value is `undefined` (shallow). */
export function compact<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value ?? {}).filter(([, item]) => item !== undefined)) as T
}
