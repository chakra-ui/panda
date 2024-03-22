import type { Context } from '@pandacss/core'
import { capitalize, unionType, TokenData } from '@pandacss/shared'
import { outdent } from 'outdent'
import pluralize from 'pluralize'

export function generateTokenTypes(ctx: Context) {
  const {
    tokens,
    config: { theme },
  } = ctx

  const set = new Set<string>()

  set.add(`export type Token = ${tokens.isEmpty ? 'string' : unionType(Array.from(tokens.byName.keys()))}`)

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
      set.add(`export type ${typeName}Token = ${unionType(value.keys())}`)
      result.add(`\t\t${key}: ${typeName}Token`)
    }

    const keyframes = Object.keys(theme?.keyframes ?? {})
    if (keyframes.length) {
      set.add(`export type AnimationName = ${unionType(keyframes)}`)
      result.add(`\t\tanimationName: AnimationName`)
    }
  }

  result.add('} & { [token: string]: never }')

  set.add(Array.from(result).join('\n'))

  set.add(`export type TokenCategory = ${unionType(Object.values(TokenData))}`)

  return outdent.string(Array.from(set).join('\n\n'))
}
