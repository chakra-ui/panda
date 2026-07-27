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

/** The shape `merge` needs from the other recipe — `cva()`'s own return satisfies it. */
interface MergeableCva {
  config: StringCvaConfig
  variantKeys: string[]
}

/** Variant keys of `other` first, then any of `own` it didn't already cover. */
function unionKeys(other: string[], own: string[]): string[] {
  const keys = [...other]
  for (const key of own) {
    if (!keys.includes(key)) keys.push(key)
  }
  return keys
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

  // `styled(Parent, styles)` fuses the two recipes here, once, at definition
  // time. The generated runtime merges style objects with `mergeCss`; on string
  // branches `cx` gives the same last-wins-per-property result.
  const merge = (other: MergeableCva) => {
    const override = other.config
    const overrideVariants = override.variants ?? {}
    const mergedVariants: VariantMap = {}
    for (const key of unionKeys(other.variantKeys, variantKeys)) {
      const group: Record<string, string> = { ...variants[key] }
      const theirs = overrideVariants[key] ?? {}
      for (const option in theirs) {
        const mine = group[option]
        group[option] = mine ? cx(mine, theirs[option]) : theirs[option]!
      }
      mergedVariants[key] = group
    }
    return cva({
      base: cx(base, override.base),
      variants: mergedVariants,
      defaultVariants: { ...defaultVariants, ...override.defaultVariants },
      compoundVariants: [...compoundVariants, ...(override.compoundVariants ?? [])],
    })
  }

  return Object.assign(cvaFn, {
    __cva__: true as const,
    variantKeys,
    variantMap: toVariantMap(variants),
    raw: resolve,
    merge,
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
