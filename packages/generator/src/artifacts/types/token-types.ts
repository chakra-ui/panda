import { capitalize, unionType } from '@pandacss/shared'
import { outdent } from 'outdent'
import pluralize from 'pluralize'
import type { Context } from '../../engines'

const categories = [
  'zIndex',
  'opacity',
  'colors',
  'fonts',
  'fontSizes',
  'fontWeights',
  'lineHeights',
  'letterSpacings',
  'sizes',
  'shadows',
  'spacing',
  'radii',
  'borders',
  'durations',
  'easings',
  'animations',
  'blurs',
  'gradients',
  'breakpoints',
  'assets',
]

export function generateTokenTypes(ctx: Context) {
  const {
    tokens,
    config: { theme },
  } = ctx

  const set = new Set<string>()

  set.add(`export type Token = ${tokens.isEmpty ? 'string' : unionType(tokens.allNames)}`)

  const result = new Set<string>(['export type Tokens = {'])

  if (tokens.isEmpty) {
    result.add('[token: string]: string')
  } else {
    const colorPaletteKeys = Object.keys(tokens.colorPalettes)
    if (colorPaletteKeys.length) {
      set.add(`export type ColorPalette = ${unionType(Object.keys(tokens.colorPalettes))}`)
    }

    for (const [key, value] of tokens.categoryMap.entries()) {
      const typeName = capitalize(pluralize.singular(key))
      set.add(`export type ${typeName}Token = ${unionType(value.keys())}`)
      result.add(`\t\t${key}: ${typeName}Token`)
    }

    const keyframes = unionType(Object.keys(theme?.keyframes ?? {}))

    if (keyframes) set.add(`export type AnimationName = ${keyframes}`)
    result.add(`\t\tanimationName: AnimationName`)
  }

  result.add('} & { [token: string]: never }')

  set.add(Array.from(result).join('\n'))

  set.add(`export type TokenCategory = ${unionType(categories)}`)

  return outdent.string(Array.from(set).join('\n\n'))
}
