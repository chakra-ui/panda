import {
  normalizeImportMap,
  type ProjectCallbackKind,
  type ProjectCallbacks,
  type ProjectHooks,
  type SerializedConfig,
} from '@pandacss/compiler-shared'
import type { UserConfig } from '@pandacss/types'
import { stringify } from 'javascript-stringify'
import { serializeHooks, type HookSerializationCallbacks } from './hooks'

const compact = <T extends Record<string, any>>(value: T): T =>
  Object.fromEntries(Object.entries(value ?? {}).filter(([, item]) => item !== undefined)) as T

const runtimeOnlyKeys = new Set(['hooks', 'plugins', 'presets', 'name'])

type Callbacks = HookSerializationCallbacks

export interface ConfigSnapshot {
  config: SerializedConfig
  callbacks: ProjectCallbacks
  hooks?: ProjectHooks
}

/**
 * Lower a resolved config to a JSON-safe `SerializedConfig` (functions → callback
 * refs, RegExp → `{ kind:'regex' }`) plus the live `callbacks`, and embed each
 * pattern's `transform`/`defaultValues` source as `codegenSource` for the Rust
 * pattern generator.
 */
export function createConfigSnapshot(config: UserConfig): ConfigSnapshot {
  const callbacks: Callbacks = {}
  const hooks = serializeHooks(config, callbacks, sanitize, hashCallbackSource)
  const serialized: SerializedConfig = {
    ...sanitize(config, [], callbacks),
    importMap: normalizeImportMap(config),
  }
  attachPatternCodegenSource(serialized, config)
  return { config: serialized, callbacks: callbacks as ProjectCallbacks, ...(hooks ? { hooks } : {}) }
}

function sanitize(value: unknown, path: string[], callbacks: Callbacks): any {
  if (typeof value === 'function') return serializeFunction(value, path, callbacks)

  if (value instanceof RegExp) return { kind: 'regex', source: value.source, flags: value.flags }

  if (Array.isArray(value)) return value.map((item, index) => sanitize(item, path.concat(String(index)), callbacks))

  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => path.length > 0 || !runtimeOnlyKeys.has(key))
      .map(([key, item]) => [key, sanitize(item, path.concat(key), callbacks)])
      .filter(([, item]) => item !== undefined),
  )
}

function serializeFunction(fn: Function, path: string[], callbacks: Callbacks) {
  const ref = getCallbackRef(path)
  if (!ref) return undefined
  callbacks[ref.kind] ??= {}
  callbacks[ref.kind]![ref.id] = fn
  // `hash` is an invalidation key only — never executed. It lets `diffConfig`
  // notice a callback body edit (the `id` is stable, so without it a body change
  // is invisible and watch mode keeps stale CSS). Best-effort: it tracks the
  // function *source*, not values it closes over.
  return { kind: 'js-callback', id: ref.id, hash: hashCallbackSource(fn) }
}

function hashCallbackSource(fn: Function): string {
  const source = stringify(fn) ?? String(fn)
  // djb2 over the source text — stable across runs, dependency-free.
  let hash = 5381
  for (let i = source.length - 1; i >= 0; i--) hash = (hash * 33) ^ source.charCodeAt(i)
  return `fn1-${(hash >>> 0).toString(36)}`
}

function getCallbackRef(path: string[]): { kind: ProjectCallbackKind; id: string } | undefined {
  const key = path.at(-1)
  if (path[0] === 'utilities' && key === 'transform') return { kind: 'utility.transform', id: path.join('.') }
  if (path[0] === 'utilities' && key === 'values') return { kind: 'utility.values', id: path.join('.') }
  if (path[0] === 'patterns' && key === 'transform') return { kind: 'pattern.transform', id: path.join('.') }
  if (path[0] === 'patterns' && key === 'defaultValues') return { kind: 'pattern.defaultValues', id: path.join('.') }
}

/**
 * Pattern `transform` is lowered to a callback ref for extraction, but codegen
 * needs its *source* to embed in the generated pattern module (Rust can't
 * stringify a JS function). Capture `{ transform, defaultValues }` source here.
 */
function attachPatternCodegenSource(serialized: SerializedConfig, config: UserConfig) {
  const patterns = config.patterns
  const serializedPatterns = serialized.patterns as Record<string, any> | undefined
  if (!patterns || !serializedPatterns) return

  for (const [name, pattern] of Object.entries(patterns)) {
    if (typeof pattern?.transform !== 'function') continue
    const source = stringify(compact({ transform: pattern.transform, defaultValues: pattern.defaultValues })) ?? ''
    if (serializedPatterns[name]) serializedPatterns[name].codegenSource = source
  }
}
