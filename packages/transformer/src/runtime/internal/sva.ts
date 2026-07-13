import { cx } from './cx'
import { cva, type StringCvaConfig } from './cva'

type CompoundVariant = NonNullable<StringCvaConfig['compoundVariants']>[number]

type SvaConfig = {
  slots?: string[]
  base?: Record<string, string>
  variants?: StringCvaConfig['variants']
  defaultVariants?: StringCvaConfig['defaultVariants']
  compoundVariants?: Array<
    Record<string, unknown> & {
      css?: Record<string, string> | string
      className?: string
      classNames?: Record<string, string>
    }
  >
  className?: Record<string, string>
}

function slotCompoundVariants(
  compoundVariants: SvaConfig['compoundVariants'],
  slot: string,
): CompoundVariant[] | undefined {
  if (!compoundVariants?.length) return undefined
  return compoundVariants
    .map((compound) => {
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
      return next
    })
    .filter((compound) => compound.css || compound.className)
}

function getSlotRecipes(config: SvaConfig): Record<string, StringCvaConfig> {
  const slots = config.slots ?? Object.keys(config.base ?? {})
  const recipes: Record<string, StringCvaConfig> = {}
  for (const slot of slots) {
    recipes[slot] = {
      base: config.base?.[slot],
      variants: config.variants,
      defaultVariants: config.defaultVariants,
      compoundVariants: slotCompoundVariants(config.compoundVariants, slot),
    }
    if (config.className?.[slot]) {
      recipes[slot] = {
        ...recipes[slot],
        base: cx(recipes[slot]?.base, config.className[slot]),
      }
    }
  }
  return recipes
}

/** String-branch slot recipe factory for transformed source. */
export function sva(config: SvaConfig) {
  const slotRecipes = getSlotRecipes(config)
  const slots = Object.entries(slotRecipes).map(([slot, recipe]) => [slot, cva(recipe)] as const)
  const defaultVariants = config.defaultVariants ?? {}
  const variantKeys = Object.keys(config.variants ?? {})

  const svaFn = (props: Record<string, unknown> = {}) => {
    const result: Record<string, string> = {}
    for (const [slot, slotFn] of slots) {
      result[slot] = slotFn(props)
    }
    return result
  }

  const raw = (props: Record<string, unknown> = {}) => {
    const result: Record<string, string> = {}
    for (const [slot, slotFn] of slots) {
      result[slot] = slotFn.raw(props)
    }
    return result
  }

  return Object.assign(svaFn, {
    __cva__: false as const,
    raw,
    config,
    variantMap: Object.fromEntries(variantKeys.map((key) => [key, Object.keys(config.variants?.[key] ?? {})])),
    variantKeys,
    classNameMap: config.className ?? {},
    getVariantProps(props: Record<string, unknown>) {
      const out: Record<string, unknown> = { ...defaultVariants }
      for (const key in props) {
        if (props[key] !== undefined) out[key] = props[key]
      }
      return out
    },
    splitVariantProps(props: Record<string, unknown>) {
      const rest: Record<string, unknown> = {}
      const variantProps: Record<string, unknown> = {}
      for (const key in props) {
        if (variantKeys.includes(key)) variantProps[key] = props[key]
        else rest[key] = props[key]
      }
      return [rest, variantProps] as const
    },
  })
}
