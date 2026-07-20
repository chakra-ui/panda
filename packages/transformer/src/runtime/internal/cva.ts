import { cx } from './cx'

type VariantMap = Record<string, Record<string, string>>

type CompoundVariant = Record<string, unknown> & {
  css?: string
  className?: string
}

export interface StringCvaConfig {
  base?: string
  variants?: VariantMap
  defaultVariants?: Record<string, string>
  compoundVariants?: CompoundVariant[]
}

function withDefaults(defaults: Record<string, string>, props: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...defaults }
  for (const key in props) {
    if (props[key] !== undefined) out[key] = props[key]
  }
  return out
}

function compoundMatches(compound: CompoundVariant, variants: Record<string, unknown>): boolean {
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

function toVariantMap(variants: VariantMap): Record<string, string[]> {
  const map: Record<string, string[]> = {}
  for (const key in variants) map[key] = Object.keys(variants[key] ?? {})
  return map
}

/** String-branch recipe factory for transformed source (TW-style cva). */
export function cva(config: StringCvaConfig) {
  const base = config.base ?? ''
  const variants = config.variants ?? {}
  const defaultVariants = config.defaultVariants ?? {}
  const compoundVariants = config.compoundVariants ?? []
  const variantKeys = Object.keys(variants)
  const variantKeySet = new Set(variantKeys)

  const resolve = (props: Record<string, unknown> = {}) => {
    const computed = withDefaults(defaultVariants, props)
    const parts: string[] = []
    if (base) parts.push(base)
    for (const key of variantKeys) {
      const value = computed[key]
      if (typeof value === 'string' && variants[key]?.[value]) {
        parts.push(variants[key][value]!)
      }
    }
    for (const compound of compoundVariants) {
      if (!compoundMatches(compound, computed)) continue
      const cls = compound.className ?? compound.css
      if (typeof cls === 'string' && cls) parts.push(cls)
    }
    return cx(...parts)
  }

  const cvaFn = (props: Record<string, unknown> = {}) => resolve(props)

  return Object.assign(cvaFn, {
    __cva__: true as const,
    variantKeys,
    variantMap: toVariantMap(variants),
    raw: resolve,
    config,
    getVariantProps(props: Record<string, unknown>) {
      return withDefaults(defaultVariants, props)
    },
    splitVariantProps(props: Record<string, unknown>) {
      const rest: Record<string, unknown> = {}
      const variantProps: Record<string, unknown> = {}
      for (const key in props) {
        if (variantKeySet.has(key)) variantProps[key] = props[key]
        else rest[key] = props[key]
      }
      return [rest, variantProps] as const
    },
  })
}
