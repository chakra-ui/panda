import type { Context } from '@pandacss/core'
import { capitalize, unionType } from '@pandacss/shared'
import { outdent } from 'outdent'
import pluralize from 'pluralize'

const categories = [
  'aspectRatios',
  'zIndex',
  'opacity',
  'colors',
  'fonts',
  'fontSizes',
  'fontWeights',
  'lineHeights',
  'letterSpacings',
  'sizes',
  'cursor',
  'shadows',
  'spacing',
  'radii',
  'borders',
  'borderWidths',
  'durations',
  'easings',
  'animations',
  'blurs',
  'gradients',
  'breakpoints',
  'assets',
]

export function generateTokenTypes(ctx: Context) {
  const { tokens } = ctx

  const set = new Set<string>()

  const tokenSet = new Set<string>()

  const result = new Set<string>(['export type Tokens = {'])

  if (tokens.isEmpty) {
    result.add('[token: string]: string')
  } else {
    const colorPaletteKeys = Array.from(tokens.view.colorPalettes.keys())
    if (colorPaletteKeys.length) {
      set.add(`export type ColorPalette = ${unionType(colorPaletteKeys)}`)
    }

    for (const [key, value] of tokens.view.categoryMap.entries()) {
      const typeName = capitalize(pluralize.singular(key))
      const categoryName = `${typeName}Token`
      set.add(`export type ${categoryName} = ${unionType(value.keys())}`)
      tokenSet.add(`${key}.$\{${categoryName}}`)
      result.add(`\t\t${key}: ${categoryName}`)
    }
  }

  result.add('} & { [token: string]: never }')

  set.add(Array.from(result).join('\n'))

  set.add(`export type TokenCategory = ${unionType(categories)}`)

  const arr = Array.from(set)
  arr.unshift(
    `export type Token = ${unionType(tokenSet, {
      stringify: (t) => `\`${t}\``,
      fallback: 'string',
    })}`,
  )

  return outdent.string(arr.join('\n\n'))
}
