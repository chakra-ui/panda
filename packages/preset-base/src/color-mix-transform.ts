import type { PropertyTransform } from '@pandacss/types'

export const createColorMixTransform =
  (prop: string): PropertyTransform =>
  (value, args) => {
    const mix = args.utils.colorMix(value)
    if (mix.invalid) return { [prop]: value }

    const cssVar = '--mix-' + prop

    return {
      [cssVar]: mix.value,
      [prop]: `var(${cssVar}, ${mix.color})`,
    }
  }
