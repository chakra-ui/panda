import { cva, type StringCvaConfig } from './cva'
import { cx } from './cx'
import { memoProps, splitVariantProps, withDefaults, type CompoundVariant } from './shared'

type SvaCompound = Record<string, unknown> & {
  css?: Record<string, string> | string
  className?: string
  classNames?: Record<string, string>
}

type SvaConfig = {
  slots?: string[]
  base?: Record<string, string>
  variants?: StringCvaConfig['variants']
  defaultVariants?: StringCvaConfig['defaultVariants']
  compoundVariants?: SvaCompound[]
  className?: Record<string, string>
}

function compoundsForSlot(compounds: SvaCompound[] | undefined, slot: string): CompoundVariant[] | undefined {
  if (!compounds?.length) return undefined
  const out: CompoundVariant[] = []
  for (const compound of compounds) {
    const next: CompoundVariant = {}
    for (const key in compound) {
      if (key === 'css' || key === 'className' || key === 'classNames') continue
      next[key] = compound[key]
    }
    const css = compound.css
    if (typeof css === 'string') next.css = css
    else if (css && typeof css === 'object' && slot in css) next.css = css[slot]
    const className = compound.classNames?.[slot] ?? compound.className
    if (className) next.className = className
    if (next.css || next.className) out.push(next)
  }
  return out.length ? out : undefined
}

/** String-branch slot recipe factory for transformed source. */
export function sva(config: SvaConfig) {
  const slots = config.slots ?? Object.keys(config.base ?? {})
  const defaultVariants = config.defaultVariants ?? {}
  const variantKeys = Object.keys(config.variants ?? {})
  const variantKeySet = new Set(variantKeys)

  const slotFns = slots.map((slot) => {
    let base = config.base?.[slot]
    if (config.className?.[slot]) base = cx(base, config.className[slot])
    return [
      slot,
      cva({
        base,
        variants: config.variants,
        defaultVariants: config.defaultVariants,
        compoundVariants: compoundsForSlot(config.compoundVariants, slot),
      }),
    ] as const
  })

  const resolve = (props: Record<string, unknown> = {}) => {
    const result: Record<string, string> = {}
    for (const [slot, fn] of slotFns) result[slot] = fn(props)
    return result
  }

  const raw = (props: Record<string, unknown> = {}) => {
    const result: Record<string, string> = {}
    for (const [slot, fn] of slotFns) result[slot] = fn.raw(props)
    return result
  }

  return Object.assign(memoProps(resolve), {
    __cva__: false as const,
    raw,
    config,
    variantMap: Object.fromEntries(variantKeys.map((key) => [key, Object.keys(config.variants?.[key] ?? {})])),
    variantKeys,
    classNameMap: config.className ?? {},
    getVariantProps: (props: Record<string, unknown>) => withDefaults(defaultVariants, props),
    splitVariantProps: (props: Record<string, unknown>) => splitVariantProps(props, variantKeySet),
  })
}
