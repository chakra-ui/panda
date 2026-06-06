export interface ConfigSourceEntry {
  kind: 'config' | 'preset'
  name?: string
  specifier?: string
  file?: string
}

export interface ConfigSources {
  entries: ConfigSourceEntry[]
  paths: Record<string, number | number[]>
}

export type SourceRecordMode = 'replace' | 'append'

export interface SourceContext {
  tracker: SourceTracker
  sourceId: number
  path: string[]
}

const sectionKeySet = new Set([
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
])

const omitKeys = new Set(['__proto__', 'constructor', 'prototype'])
const tokenKeys = new Set(['description', 'extensions', 'type', 'value', 'deprecated'])
const directFieldSections = new Set(['patterns', 'utilities'])
const themeEntryKeys = new Set([
  'animationStyles',
  'breakpoints',
  'containerSizes',
  'keyframes',
  'layerStyles',
  'recipes',
  'slotRecipes',
  'textStyles',
])

export class SourceTracker {
  sources: ConfigSources

  constructor(entries: ConfigSourceEntry[]) {
    this.sources = { entries, paths: {} }
  }

  record(path: string[], sourceId: number, mode: SourceRecordMode) {
    const key = path.join('.')
    const current = this.sources.paths[key]

    if (current === undefined || mode === 'replace') {
      this.sources.paths[key] = sourceId
      return
    }

    if (Array.isArray(current)) {
      if (!current.includes(sourceId)) current.push(sourceId)
      return
    }

    if (current !== sourceId) this.sources.paths[key] = [current, sourceId]
  }

  moveIfMissing(from: string[], to: string[]) {
    const fromKey = from.join('.')
    const toKey = to.join('.')
    if (this.sources.paths[fromKey] === undefined) return
    this.sources.paths[toKey] ??= this.sources.paths[fromKey]
    delete this.sources.paths[fromKey]
  }

  delete(path: string[]) {
    delete this.sources.paths[path.join('.')]
  }
}

export function recordSource(
  context: SourceContext | undefined,
  path: string[] | undefined,
  value: unknown,
  current: unknown,
  mode: SourceRecordMode,
) {
  if (!context || !path || !shouldTrackPath(path, value, current)) return
  context.tracker.record(path, context.sourceId, mode)
}

export function recordNestedSources(context: SourceContext | undefined, path: string[] | undefined, value: unknown) {
  if (!context || !path || !isPlainObject(value)) return

  for (const [key, child] of Object.entries(value)) {
    if (child === undefined || omitKeys.has(key)) continue
    const childPath = path.concat(key)
    recordSource(context, childPath, child, undefined, 'replace')
    recordNestedSources(context, childPath, child)
  }
}

function shouldTrackPath(path: string[], value: unknown, current: unknown): boolean {
  if (path.length === 1) return true

  const [section, ...rest] = path
  if (!sectionKeySet.has(section) || rest.length === 0) return false

  if (section === 'theme') return shouldTrackThemePath(rest, value, current)
  if (section === 'staticCss') return shouldTrackStaticCssPath(rest)
  if (section === 'conditions' || section === 'globalVars') return rest.length === 1
  if (directFieldSections.has(section)) return rest.length <= 2

  return rest.length === 1
}

function shouldTrackStaticCssPath(rest: string[]) {
  return rest.length === 1 || ((rest[0] === 'recipes' || rest[0] === 'patterns') && rest.length === 2)
}

function shouldTrackThemePath(rest: string[], value: unknown, current: unknown): boolean {
  const [key] = rest

  if (key === 'tokens' || key === 'semanticTokens') {
    if (rest.length < 3) return false
    const last = rest.at(-1)!
    return tokenKeys.has(last) || isPlainObject(value) || current !== undefined
  }

  if (themeEntryKeys.has(key)) return rest.length <= 3
  if (key === 'containerNames' || key === 'colorPalette') return rest.length <= 2

  return rest.length <= 2
}

function isPlainObject(value: unknown): value is Record<string, any> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}
