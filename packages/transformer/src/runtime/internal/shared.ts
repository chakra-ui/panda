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
