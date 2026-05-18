import type { UserConfig } from '@pandacss/types'

const runtimeOnlyKeys = new Set(['hooks', 'plugins', 'presets', 'name'])

export type SerializedConfig = Record<string, unknown>
export type ConfigCallbackKind = 'utility.transform' | 'utility.values' | 'pattern.transform' | 'pattern.defaultValues'
export type ConfigCallbacks = Partial<Record<ConfigCallbackKind, Record<string, Function>>>

export interface ConfigSnapshot {
  config: SerializedConfig
  callbacks: ConfigCallbacks
}

export function createSerializedConfig(config: UserConfig): SerializedConfig {
  return createConfigSnapshot(config).config
}

export function createConfigSnapshot(config: UserConfig): ConfigSnapshot {
  const callbacks: ConfigCallbacks = {}
  return {
    config: {
      ...sanitize(config, [], callbacks),
      importMap: normalizeImportMap(config),
    },
    callbacks,
  }
}

function sanitize(value: unknown, path: string[], callbacks: ConfigCallbacks): any {
  if (typeof value === 'function') {
    return serializeFunction(value, path, callbacks)
  }

  if (value instanceof RegExp) {
    return { kind: 'regex', source: value.source, flags: value.flags }
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => sanitize(item, path.concat(String(index)), callbacks))
  }

  if (!value || typeof value !== 'object') {
    return value
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => path.length > 0 || !runtimeOnlyKeys.has(key))
      .map(([key, item]) => [key, sanitize(item, path.concat(key), callbacks)])
      .filter(([, item]) => item !== undefined),
  )
}

function serializeFunction(fn: Function, path: string[], callbacks: ConfigCallbacks) {
  const ref = getCallbackRef(path)
  if (!ref) return undefined

  callbacks[ref.kind] ??= {}
  callbacks[ref.kind]![ref.id] = fn
  return { kind: 'js-callback', id: ref.id }
}

function getCallbackRef(path: string[]): { kind: ConfigCallbackKind; id: string } | undefined {
  const key = path.at(-1)
  if (path[0] === 'utilities' && key === 'transform') {
    return { kind: 'utility.transform', id: path.join('.') }
  }
  if (path[0] === 'utilities' && key === 'values') {
    return { kind: 'utility.values', id: path.join('.') }
  }
  if (path[0] === 'patterns' && key === 'transform') {
    return { kind: 'pattern.transform', id: path.join('.') }
  }
  if (path[0] === 'patterns' && key === 'defaultValues') {
    return { kind: 'pattern.defaultValues', id: path.join('.') }
  }
}

function normalizeImportMap(config: UserConfig) {
  const outdir = config.outdir?.split('/').at(-1) || 'styled-system'
  const inputs = Array.isArray(config.importMap) ? config.importMap : [config.importMap]
  const output = {
    css: [] as string[],
    recipe: [] as string[],
    pattern: [] as string[],
    jsx: [] as string[],
    tokens: [] as string[],
  }

  for (const input of inputs) {
    const normalized = normalizeImportMapInput(input, outdir)
    output.css.push(...normalized.css)
    output.recipe.push(...normalized.recipe)
    output.pattern.push(...normalized.pattern)
    output.jsx.push(...normalized.jsx)
    output.tokens.push(...normalized.tokens)
  }

  return output
}

function normalizeImportMapInput(input: any, outdir: string) {
  if (typeof input === 'string') {
    return {
      css: [`${input}/css`],
      recipe: [`${input}/recipes`],
      pattern: [`${input}/patterns`],
      jsx: [`${input}/jsx`],
      tokens: [`${input}/tokens`],
    }
  }

  return {
    css: asArray(input?.css ?? `${outdir}/css`),
    recipe: asArray(input?.recipes ?? `${outdir}/recipes`),
    pattern: asArray(input?.patterns ?? `${outdir}/patterns`),
    jsx: asArray(input?.jsx ?? `${outdir}/jsx`),
    tokens: asArray(input?.tokens ?? `${outdir}/tokens`),
  }
}

function asArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}
