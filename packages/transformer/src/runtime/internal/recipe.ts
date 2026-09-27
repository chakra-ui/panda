import { withDefaults, type VariantValue } from './shared'

type RecipeConfig = { defaultVariants?: Record<string, VariantValue> }

/**
 * Attach the observable recipe surface to a compiler-specialized `cva`/`sva` function.
 * A `classNameMap` marks the function as a slot recipe.
 */
export function attachRecipe<F extends (props?: Record<string, unknown>) => unknown, C extends object>(
  fn: F,
  config: C,
  variantKeys: string[],
  variantMap: Record<string, string[]>,
  classNameMap?: Record<string, string>,
) {
  const defaults = (config as RecipeConfig).defaultVariants ?? {}
  return Object.assign(fn, {
    __cva__: !classNameMap,
    variantKeys,
    variantMap,
    ...(classNameMap && { classNameMap }),
    config,
    getVariantProps: (props: Record<string, unknown> = {}) => withDefaults(defaults, props),
    splitVariantProps: (props: Record<string, unknown>) => {
      const variantProps: Record<string, unknown> = {}
      const restProps: Record<string, unknown> = {}
      for (const key in props) (variantKeys.includes(key) ? variantProps : restProps)[key] = props[key]
      return [variantProps, restProps] as const
    },
  })
}
