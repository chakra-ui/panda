import type { Config } from '@pandacss/types'
import { PandaError } from './error'
import { recordNestedSources, recordSource, SourceTracker, type ConfigSourceEntry, type SourceContext } from './sources'

export type Dict = Record<string, any>
export type Extendable<T> = T & { extend?: T }
export type ExtendableConfig = Extendable<Config>

export interface SourcedConfig {
  config: ExtendableConfig
  source: ConfigSourceEntry
}

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
  return mergeConfigsInternal(configs)
}

export function mergeConfigsWithSources(configs: SourcedConfig[]) {
  const tracker = new SourceTracker(configs.map((item) => item.source))
  const config = mergeConfigsInternal(configs, tracker)
  return { config, sources: tracker.sources }
}

function mergeConfigsInternal(configs: ExtendableConfig[] | SourcedConfig[], tracker?: SourceTracker) {
  const result: Dict = {}
  const sections = Object.fromEntries(sectionKeys.map((key) => [key, {}])) as Record<(typeof sectionKeys)[number], Dict>

  for (let index = 0; index < configs.length; index++) {
    const config = tracker ? (configs[index] as SourcedConfig).config : (configs[index] as ExtendableConfig)
    const context = tracker ? { tracker, sourceId: index, path: [] } : undefined

    for (const [key, value] of Object.entries(config)) {
      if (value === undefined || sectionKeySet.has(key) || runtimeOnlyKeys.has(key) || omitKeys.has(key)) continue
      result[key] = clone(value)
      context?.tracker.record([key], context.sourceId, 'replace')
    }

    for (const key of sectionKeys) {
      const section = config[key]
      if (isPlainObject(section)) mergeSectionInto(key, sections[key], section, context)
    }
  }

  for (const key of sectionKeys) {
    if (!isEmptyObject(sections[key])) result[key] = sections[key]
  }

  if (result.theme?.tokens) normalizeNestedTokens(result.theme.tokens, tracker)

  return result
}

export function isPlainObject(value: unknown): value is Dict {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

function mergeSectionInto(sectionName: string, target: Dict, section: Dict, context?: SourceContext) {
  const childContext = context && { ...context, path: [sectionName] }

  for (const [key, value] of Object.entries(section)) {
    if (key === 'extend' || value === undefined || omitKeys.has(key)) continue
    mergeValue(target, key, value, 'replace', childContext)
  }

  if (section.extend === undefined) return
  if (!isPlainObject(section.extend)) {
    throw new PandaError('CONFIG_ERROR', `💥 Config section \`${sectionName}.extend\` must be an object.`)
  }

  for (const [key, value] of Object.entries(section.extend)) {
    if (value === undefined || omitKeys.has(key)) continue
    mergeValue(target, key, value, 'concat', childContext)
  }
}

function mergeValue(
  target: Dict,
  key: string,
  value: unknown,
  arrayMode: 'replace' | 'concat',
  context?: SourceContext,
) {
  const current = target[key]
  const path = context?.path.concat(key)

  if (Array.isArray(current) && Array.isArray(value)) {
    target[key] = arrayMode === 'concat' ? current.concat(clone(value)) : clone(value)
    recordSource(context, path, value, current, arrayMode === 'concat' ? 'append' : 'replace')
    return
  }

  if (isPlainObject(current) && isPlainObject(value)) {
    recordSource(context, path, value, current, 'append')
    const childContext = context && path ? { ...context, path } : undefined

    for (const [childKey, childValue] of Object.entries(value)) {
      if (childValue !== undefined && !omitKeys.has(childKey))
        mergeValue(current, childKey, childValue, arrayMode, childContext)
    }
    return
  }

  target[key] = clone(value)
  recordSource(context, path, value, current, 'replace')
  recordNestedSources(context, path, value)
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

function normalizeNestedTokens(tokens: Dict, tracker?: SourceTracker) {
  const stack = [{ value: tokens, path: ['theme', 'tokens'] }]

  while (stack.length > 0) {
    const current = stack.pop()!

    for (const [key, value] of Object.entries(current.value)) {
      if (!isPlainObject(value)) continue

      if (isValidToken(value)) {
        normalizeToken(value, tracker, current.path.concat(key))
      } else {
        stack.push({ value, path: current.path.concat(key) })
      }
    }
  }
}

function normalizeToken(token: Dict, tracker: SourceTracker | undefined, path: string[]) {
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
    const moved = !token.DEFAULT[key]
    token.DEFAULT[key] ||= token[key]
    if (moved) tracker?.moveIfMissing(path.concat(key), path.concat('DEFAULT', key))
    else tracker?.delete(path.concat(key))
    delete token[key]
  }
}

function isValidToken(token: Dict) {
  return Object.hasOwnProperty.call(token, 'value')
}

function isEmptyObject(value: Dict) {
  return Object.keys(value).length === 0
}
