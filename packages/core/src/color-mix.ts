import type { TransformArgs } from '@pandacss/types'

export const colorMix = (value: string, { token }: TransformArgs) => {
  if (!value) return { invalid: true, value }

  const [rawColor, rawOpacity] = value.split('/')

  if (!rawOpacity) {
    return { invalid: true, value: rawColor }
  }

  if (isNaN(Number(rawOpacity))) {
    return { invalid: true, value: rawColor }
  }

  const colorToken = token(`colors.${rawColor}`)
  const opacityToken = token(`opacity.${rawOpacity}`)

  const percent = opacityToken ? Number(opacityToken) * 100 : `${rawOpacity}%`
  const color = colorToken ?? rawColor

  return {
    invalid: false,
    color,
    value: `color-mix(in srgb, ${color} ${percent}, transparent)`,
  }
}
