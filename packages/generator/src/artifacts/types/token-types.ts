import { capitalize, unionType } from '@pandacss/shared'
import { outdent } from 'outdent'
import pluralize from 'pluralize'
import type { Context } from '../../engines'

export function generateTokenTypes(ctx: Context) {
  const { tokens } = ctx

  const set = new Set<string>()

  set.add(`export type Token = ${tokens.isEmpty ? 'string' : unionType(tokens.allNames)}`)

  const result = new Set<string>(['export type Tokens = {'])

  if (tokens.isEmpty) {
    result.add('[token: string]: string')
  } else {
    for (const [key, value] of tokens.categoryMap.entries()) {
      const typeName = capitalize(pluralize.singular(key))
      set.add(`export type ${typeName} = ${unionType(value.keys())}`)
      set.add(`export type ColorPalette = ${unionType(Object.keys(tokens.colorPalettes))}`)
      result.add(`\t\t${key}: ${typeName}`)
    }
  }

  result.add('} & { [token: string]: never }')

  set.add(Array.from(result).join('\n'))

  return outdent.string(Array.from(set).join('\n\n'))
}
