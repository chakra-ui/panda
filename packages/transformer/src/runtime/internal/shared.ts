import { cx } from './cx'

export type VariantMap = Record<string, Record<string, string>>
export type VariantValue = string | number | boolean
export type CompoundVariant = Record<string, unknown> & {
  css?: string
  className?: string
}

export function withDefaults(
  defaults: Record<string, VariantValue>,
  props: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...defaults }
  for (const key in props) {
    if (props[key] !== undefined) out[key] = props[key]
  }
  return out
}

export function splitVariantProps(
  props: Record<string, unknown>,
  variantKeySet: Set<string>,
): [Record<string, unknown>, Record<string, unknown>] {
  const rest: Record<string, unknown> = {}
  const variantProps: Record<string, unknown> = {}
  for (const key in props) {
    if (variantKeySet.has(key)) variantProps[key] = props[key]
    else rest[key] = props[key]
  }
  return [rest, variantProps]
}

export function toVariantMap(variants: VariantMap): Record<string, string[]> {
  const map: Record<string, string[]> = {}
  for (const key in variants) map[key] = Object.keys(variants[key] ?? {})
  return map
}

export function compoundMatches(compound: CompoundVariant, variants: Record<string, unknown>): boolean {
  for (const key in compound) {
    if (key === 'css' || key === 'className' || key === 'classNames') continue
    const expected = compound[key]
    const actual = variants[key]
    if (Array.isArray(expected)) {
      if (!expected.includes(actual)) return false
    } else if (actual !== expected) {
      return false
    }
  }
  return true
}

/** JS coerces `true` → `"true"` on property access — same as generated cva. */
export function variantClass(variants: VariantMap, key: string, value: unknown): string | undefined {
  if (value == null) return undefined
  const cls = variants[key]?.[value as string | number]
  return typeof cls === 'string' && cls ? cls : undefined
}

/** Memoize flat prop → result. Mirrors generated `styled-system` `memo(cvaFn)`. */
export function memoProps<T>(resolve: (props: Record<string, unknown>) => T): (props?: Record<string, unknown>) => T {
  const cache = new Map<string, T>()
  let lastKey = ''
  let lastValue: T | undefined
  let hasLast = false

  return (props: Record<string, unknown> = {}) => {
    let key = ''
    for (const k in props) {
      const value = props[k]
      if (value !== undefined) key += `${k}:${String(value)}|`
    }
    if (hasLast && key === lastKey) return lastValue as T
    const hit = cache.get(key)
    if (hit !== undefined) {
      lastKey = key
      lastValue = hit
      hasLast = true
      return hit
    }
    const out = resolve(props)
    cache.set(key, out)
    if (cache.size > 500) cache.delete(cache.keys().next().value!)
    lastKey = key
    lastValue = out
    hasLast = true
    return out
  }
}

export function joinClasses(parts: string[]): string {
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0]!
  return cx(...parts)
}

function isBooleanBranch(branch: Record<string, string> | undefined): branch is { true: string } {
  if (!branch) return false
  const keys = Object.keys(branch)
  return keys.length === 1 && keys[0] === 'true' && typeof branch.true === 'string'
}

/**
 * Boolean-only `{ true: class }` variants, optionally with boolean defaults.
 * Compounds are out — the table would have to expand them.
 */
function booleanKeys(
  variants: VariantMap,
  keys: string[],
  defaults: Record<string, VariantValue>,
  hasCompounds: boolean,
): string[] | undefined {
  if (hasCompounds || keys.length === 0 || keys.length > 12) return undefined
  for (const key of keys) {
    if (!isBooleanBranch(variants[key])) return undefined
  }
  for (const key in defaults) {
    if (!keys.includes(key)) return undefined
    const value = defaults[key]
    if (value !== true && value !== false && value !== 'true' && value !== 'false') return undefined
  }
  return keys
}

/** Only `true` / `"true"` select the branch — the same key lookup `variantClass` does. */
function selectsTrue(value: unknown): boolean {
  return value === true || value === 'true'
}

/**
 * Dispatch a boolean-only recipe through a bit mask instead of a memo key.
 * Entries are built on first use, so a wide recipe costs nothing up front.
 */
export function booleanBitset(
  base: string,
  variants: VariantMap,
  keys: string[],
  defaults: Record<string, VariantValue>,
  hasCompounds: boolean,
): ((props?: Record<string, unknown>) => string) | undefined {
  const boolKeys = booleanKeys(variants, keys, defaults, hasCompounds)
  if (!boolKeys) return undefined

  const n = boolKeys.length
  let defaultMask = 0
  for (let i = 0; i < n; i++) {
    if (selectsTrue(defaults[boolKeys[i]!])) defaultMask |= 1 << i
  }

  const table = new Array<string | undefined>(1 << n)
  const build = (mask: number) => {
    const parts: string[] = []
    if (base) parts.push(base)
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) parts.push(variants[boolKeys[i]!]!.true!)
    }
    return joinClasses(parts)
  }

  return (props: Record<string, unknown> = {}) => {
    let mask = defaultMask
    for (let i = 0; i < n; i++) {
      // An absent prop is not a choice — the default stands.
      const value = props[boolKeys[i]!]
      if (value === undefined) continue
      if (selectsTrue(value)) mask |= 1 << i
      else mask &= ~(1 << i)
    }
    return (table[mask] ??= build(mask))
  }
}

/** Largest table a recipe may index. Past this, the memo path is cheaper than the array. */
const MAX_VARIANT_STATES = 4096

/**
 * Option lookups keyed by the value as authored and by its non-string
 * spellings, so `{ disabled: true }` and `{ size: 2 }` hit without coercing
 * on every call.
 */
function optionIndex(options: string[]): Map<unknown, number> {
  const index = new Map<unknown, number>()
  for (let i = 0; i < options.length; i++) {
    const option = options[i]!
    const slot = i + 1
    index.set(option, slot)
    if (option === 'true') index.set(true, slot)
    else if (option === 'false') index.set(false, slot)
    else {
      const numeric = Number(option)
      if (option !== '' && !Number.isNaN(numeric)) index.set(numeric, slot)
    }
  }
  return index
}

interface VariantSlot {
  key: string
  options: string[]
  index: Map<unknown, number>
  radix: number
  stride: number
}

/**
 * Dispatch any compound-free recipe through a mixed-radix index: each variant
 * owns `options.length + 1` states, where 0 means unset or unmatched. Entries
 * are built on first use.
 *
 * Boolean-only recipes go through [`booleanBitset`] instead, which is cheaper
 * still. This covers the rest — `size` / `tone` and friends.
 */
export function variantTable(
  base: string,
  variants: VariantMap,
  keys: string[],
  defaults: Record<string, VariantValue>,
  hasCompounds: boolean,
): ((props?: Record<string, unknown>) => string) | undefined {
  if (hasCompounds || keys.length === 0) return undefined

  const slots: VariantSlot[] = []
  let states = 1
  for (const key of keys) {
    const options = Object.keys(variants[key] ?? {})
    if (options.length === 0) return undefined
    slots.push({ key, options, index: optionIndex(options), radix: options.length + 1, stride: states })
    states *= options.length + 1
    if (states > MAX_VARIANT_STATES) return undefined
  }

  let defaultState = 0
  for (const key in defaults) {
    const slot = slots.find((candidate) => candidate.key === key)
    if (!slot) return undefined
    const chosen = slot.index.get(defaults[key])
    // An unknown default selects nothing, which only `resolve` models.
    if (chosen === undefined) return undefined
    defaultState += chosen * slot.stride
  }

  const table = new Array<string | undefined>(states)
  const build = (state: number) => {
    const parts: string[] = []
    if (base) parts.push(base)
    for (const slot of slots) {
      const chosen = Math.floor(state / slot.stride) % slot.radix
      if (chosen === 0) continue
      const cls = variants[slot.key]![slot.options[chosen - 1]!]
      if (cls) parts.push(cls)
    }
    return joinClasses(parts)
  }

  return (props: Record<string, unknown> = {}) => {
    let state = defaultState
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i]!
      // An absent prop is not a choice — the default stands.
      const value = props[slot.key]
      if (value === undefined) continue
      const chosen = slot.index.get(value) ?? 0
      const current = Math.floor(state / slot.stride) % slot.radix
      state += (chosen - current) * slot.stride
    }
    return (table[state] ??= build(state))
  }
}
