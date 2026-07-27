import {
  compoundMatches,
  splitVariantProps,
  toVariantMap,
  variantClass,
  withDefaults,
  type CompoundVariant,
  type VariantMap,
  type VariantValue,
} from './shared'
import { cx } from './cx'

export interface StringCvaConfig {
  base?: string
  variants?: VariantMap
  defaultVariants?: Record<string, VariantValue>
  compoundVariants?: CompoundVariant[]
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
      const cls = variantClass(variants, key, computed[key])
      if (cls) parts.push(cls)
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
    getVariantProps: (props: Record<string, unknown>) => withDefaults(defaultVariants, props),
    splitVariantProps: (props: Record<string, unknown>) => splitVariantProps(props, variantKeySet),
  })
}
