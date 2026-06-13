import type { PropertyTransform } from '@pandacss/types'

export const createColorMixTransform = (prop: string): PropertyTransform => {
  return (value, args) => {
    const mix = args.utils.colorMix(value)
    if (mix.invalid) return { [prop]: value }

    return { [prop]: mix.value }
  }
}
