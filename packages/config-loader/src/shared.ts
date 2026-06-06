import type { Config } from '@pandacss/types'
import { PandaError } from './error'

export type Dict = Record<string, any>
export type Extendable<T> = T & { extend?: T }
export type ExtendableConfig = Extendable<Config>

const sectionKeys = [
  'conditions',
  'theme',
  'patterns',
  'utilities',
  'globalCss',
  'globalVars',
  'globalFontface',
  'globalPositionTry',
  'staticCss',
  'themes',
] as const

const sectionKeySet = new Set<string>(sectionKeys)
const omitKeys = new Set(['__proto__', 'constructor', 'prototype'])
const runtimeOnlyKeys = new Set(['presets', 'plugins', 'hooks', 'name', 'extend'])
const tokenKeys = new Set(['description', 'extensions', 'type', 'value', 'deprecated'])

export function mergeConfigs(configs: ExtendableConfig[]) {
  const result: Dict = {}
  const sections = Object.fromEntries(sectionKeys.map((key) => [key, {}])) as Record<(typeof sectionKeys)[number], Dict>

  for (const config of configs) {
    for (const [key, value] of Object.entries(config)) {
      if (value === undefined || sectionKeySet.has(key) || runtimeOnlyKeys.has(key) || omitKeys.has(key)) continue
      result[key] = clone(value)
    }

    for (const key of sectionKeys) {
      const section = config[key]
      if (isPlainObject(section)) mergeSectionInto(key, sections[key], section)
    }
  }

  for (const key of sectionKeys) {
    if (!isEmptyObject(sections[key])) result[key] = sections[key]
  }

  if (result.theme?.tokens) normalizeNestedTokens(result.theme.tokens)

  return result
}

export function isPlainObject(value: unknown): value is Dict {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

function mergeSectionInto(sectionName: string, target: Dict, section: Dict) {
  for (const [key, value] of Object.entries(section)) {
    if (key === 'extend' || value === undefined || omitKeys.has(key)) continue
    mergeValue(target, key, value, 'replace')
  }

  if (section.extend === undefined) return
  if (!isPlainObject(section.extend)) {
    throw new PandaError('CONFIG_ERROR', `💥 Config section \`${sectionName}.extend\` must be an object.`)
  }

  for (const [key, value] of Object.entries(section.extend)) {
    if (value === undefined || omitKeys.has(key)) continue
    mergeValue(target, key, value, 'concat')
  }
}

function mergeValue(target: Dict, key: string, value: unknown, arrayMode: 'replace' | 'concat') {
  const current = target[key]

  if (Array.isArray(current) && Array.isArray(value)) {
    target[key] = arrayMode === 'concat' ? current.concat(clone(value)) : clone(value)
    return
  }

  if (isPlainObject(current) && isPlainObject(value)) {
    for (const [childKey, childValue] of Object.entries(value)) {
      if (childValue !== undefined && !omitKeys.has(childKey)) mergeValue(current, childKey, childValue, arrayMode)
    }
    return
  }

  target[key] = clone(value)
}

function clone<T>(value: T): T {
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

function normalizeNestedTokens(tokens: Dict) {
  const stack = [tokens]

  while (stack.length > 0) {
    const current = stack.pop()!

    for (const value of Object.values(current)) {
      if (!isPlainObject(value)) continue

      if (isValidToken(value)) {
        normalizeToken(value)
      } else {
        stack.push(value)
      }
    }
  }
}

function normalizeToken(token: Dict) {
  let hasNestedKeys = false
  for (const key of Object.keys(token)) {
    if (!tokenKeys.has(key)) {
      hasNestedKeys = true
      break
    }
  }
  if (!hasNestedKeys) return

  token.DEFAULT ||= {}
  for (const key of tokenKeys) {
    if (token[key] == null) continue
    token.DEFAULT[key] ||= token[key]
    delete token[key]
  }
}

function isValidToken(token: Dict) {
  return Object.hasOwnProperty.call(token, 'value')
}

function isEmptyObject(value: Dict) {
  return Object.keys(value).length === 0
}
