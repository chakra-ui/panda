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
