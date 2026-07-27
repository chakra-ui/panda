export type VariantMap = Record<string, Record<string, string>>
export type CompoundVariant = Record<string, unknown> & {
  css?: string
  className?: string
}

export function withDefaults(
  defaults: Record<string, string>,
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
