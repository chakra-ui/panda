import { PandaError } from './error'
import { recordNestedSources, recordSource, SourceTracker, type ConfigSourceEntry, type SourceContext } from './sources'
import { clone, isPlainObject, omitKeys, type Dict, type ExtendableConfig } from './shared'

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
const runtimeOnlyKeys = new Set(['presets', 'plugins', 'hooks', 'name', 'extend'])
const tokenKeys = new Set(['description', 'extensions', 'type', 'value', 'deprecated'])

/**
 * Same merge, but also records which config contributed each value
 * so the result can be traced back to its preset/config of origin.
 */
export function mergeConfigsWithSources(configs: SourcedConfig[]) {
  const tracker = new SourceTracker(configs.map((item) => item.source))
  const config = mergeConfigs(configs, tracker)

  return { config, sources: tracker.sources }
}

/**
 * Merges an ordered list of configs (presets first, user config last) into one flat config.
 * Top-level keys replace; section keys deep-merge, with `extend` appending instead of replacing.
 */
export function mergeConfigs(configs: ExtendableConfig[]): Dict
export function mergeConfigs(configs: SourcedConfig[], tracker: SourceTracker): Dict
export function mergeConfigs(configs: ExtendableConfig[] | SourcedConfig[], tracker?: SourceTracker) {
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
    if (Object.keys(sections[key]).length > 0) result[key] = sections[key]
  }

  if (result.theme?.tokens) normalizeNestedTokens(result.theme.tokens, tracker)

  return result
}

/**
 * Merges one config's section into the accumulated section.
 * Direct keys replace what previous configs set; `extend` keys deep-merge and concat arrays.
 */
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

/**
 * Recursively merges a value into the target: plain objects merge key by key,
 * arrays concat or replace depending on `arrayMode`, everything else is cloned in.
 */
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

/**
 * Hoists token properties (`value`, `description`, …) into `DEFAULT`
 * when a token object also contains nested child tokens.
 */
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
