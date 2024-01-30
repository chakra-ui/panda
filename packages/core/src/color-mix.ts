import type { TransformArgs } from '@pandacss/types'

export const colorMix = (value: string, token: TransformArgs['token']) => {
  if (!value || typeof value !== 'string') return { invalid: true, value }

  const [rawColor, rawOpacity] = value.split('/')

  if (!rawColor || !rawOpacity) {
    return { invalid: true, value: rawColor }
  }

  const colorToken = token(`colors.${rawColor}`)
  const opacityToken = token.raw(`opacity.${rawOpacity}`)?.value

  if (!opacityToken && isNaN(Number(rawOpacity))) {
    return { invalid: true, value: rawColor }
  }

  const percent = opacityToken ? Number(opacityToken) * 100 + '%' : `${rawOpacity}%`
  const color = colorToken ?? rawColor

  return {
    invalid: false,
    color,
    value: `color-mix(in srgb, ${color} ${percent}, transparent)`,
  }
}
