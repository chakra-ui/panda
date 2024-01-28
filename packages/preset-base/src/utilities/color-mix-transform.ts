import type { NestedCssProperties, PropertyTransform } from '@pandacss/types'

export const createColorMixTransform =
  (prop: string, fallback = true): PropertyTransform =>
  (value, args) => {
    const mix = args.utils.colorMix(value, args)
    if (mix.invalid) return { [prop]: value }

    const cssVar = '--mix-' + prop

    return {
      ...(fallback && {
        [cssVar]: mix.value,
      }),
      [prop]: fallback ? `var(${cssVar}, ${mix.color})` : mix.value,
    } as any as NestedCssProperties
  }
