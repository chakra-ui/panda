import { cx } from './cx'
import { memoRecipe } from './memo'
import { compoundMatches, withDefaults, type CompoundVariant, type VariantValue } from './shared'

type Style = Record<string, unknown>
type Props = Record<string, unknown>

interface RecipeConfig {
  slots?: string[]
  base?: Style
  variants?: Record<string, Record<string, Style>>
  defaultVariants?: Record<string, VariantValue>
  compoundVariants?: CompoundVariant[]
}

/** The public surface of a styled-system `cva` that `merge` reads from its operand. */
interface RecipeLike {
  (props?: Props): string
  raw(props?: Props): Style
  variantKeys?: string[]
  variantMap?: Record<string, string[]>
  config?: RecipeConfig
}

const isStyleObject = (value: unknown): value is Style =>
  value != null && typeof value === 'object' && !Array.isArray(value)

/** Deep-merge style objects into a fresh object; later styles win. */
function mergeStyles(...styles: unknown[]): Style {
  const out: Style = {}
  for (const style of styles) {
    if (!isStyleObject(style)) continue
    for (const key in style) {
      const value = style[key]
      out[key] = isStyleObject(value) ? mergeStyles(out[key], value) : value
    }
  }
  return out
}

/** Mirrors the generated `cva().raw`: base, then selected variants, then matching compounds. */
function resolveRaw(config: RecipeConfig, props: Props, pick: (style: unknown) => unknown = (style) => style): Style {
  const selected = withDefaults(config.defaultVariants ?? {}, props)
  const variants = config.variants ?? {}
  const styles = [pick(config.base)]
  for (const key in selected) styles.push(pick(variants[key]?.[selected[key] as string]))
  for (const compound of config.compoundVariants ?? []) {
    if (compoundMatches(compound, selected)) styles.push(pick(compound.css))
  }
  return mergeStyles(...styles)
}

function resolveSlotRaw(config: RecipeConfig, props: Props): Record<string, Style> {
  const result: Record<string, Style> = {}
  for (const slot of config.slots ?? Object.keys(config.base ?? {})) {
    result[slot] = resolveRaw(config, props, (style) => (style as Style | undefined)?.[slot])
  }
  return result
}

/**
 * Fallback for a manual `.merge()` call, which has no styled-system `cva` to rebuild from. Composes classes,
 * so the child wins any conflict through the conflict-aware `cx`; `raw` composes the same way.
 */
function mergeRecipes(parent: RecipeLike, child: RecipeLike) {
  const defaultVariants = { ...parent.config?.defaultVariants, ...child.config?.defaultVariants }
  const variantKeys = [...new Set([...(parent.variantKeys ?? []), ...(child.variantKeys ?? [])])]
  const resolve = (props: Props = {}) => withDefaults(defaultVariants, props)
  const merged = attachRecipe(
    (props?: Props) => {
      const selected = resolve(props)
      return cx(parent(selected), child(selected))
    },
    // Compounds from either side rule out the coercing table memo.
    {
      defaultVariants,
      compoundVariants: [...(parent.config?.compoundVariants ?? []), ...(child.config?.compoundVariants ?? [])],
    },
    variantKeys,
    { ...parent.variantMap, ...child.variantMap },
  )
  merged.raw = (props?: Props) => {
    const selected = resolve(props)
    return mergeStyles(parent.raw(selected), child.raw(selected))
  }
  return merged
}

/**
 * Attach the observable recipe surface to a compiler-specialized `cva`/`sva` function.
 * A `classNameMap` marks the function as a slot recipe.
 */
export function attachRecipe<F extends (props?: Props) => any, C extends object>(
  fn: F,
  config: C,
  variantKeys: string[],
  variantMap: Record<string, string[]>,
  classNameMap?: Record<string, string>,
) {
  const recipeConfig = config as RecipeConfig
  const defaults = recipeConfig.defaultVariants ?? {}
  const recipe = memoRecipe(fn, variantMap, recipeConfig.compoundVariants?.length) as F
  return Object.assign(recipe, {
    __cva__: !classNameMap,
    variantKeys,
    variantMap,
    ...(classNameMap && { classNameMap }),
    config,
    raw: (props: Props = {}): any =>
      classNameMap ? resolveSlotRaw(recipeConfig, props) : resolveRaw(recipeConfig, props),
    // The styled factory passes its own `cva`, so chains merge exactly like styled-system.
    merge: (other: RecipeLike, cva?: (config: C) => { merge(other: RecipeLike): unknown }) =>
      cva ? cva(config).merge(other) : mergeRecipes(recipe as unknown as RecipeLike, other),
    getVariantProps: (props: Props = {}) => withDefaults(defaults, props),
    splitVariantProps: (props: Props) => {
      const variantProps: Props = {}
      const restProps: Props = {}
      for (const key in props) (variantKeys.includes(key) ? variantProps : restProps)[key] = props[key]
      return [variantProps, restProps] as const
    },
  })
}
