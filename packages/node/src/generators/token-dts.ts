import type { TokenDictionary } from '@pandacss/token-dictionary'
import { unionType, capitalize } from '@pandacss/shared'
import { outdent } from 'outdent'
import pluralize from 'pluralize'

export function generateTokenDts(dict: TokenDictionary) {
  const set = new Set<string>()

  set.add(`export type Token = ${dict.isEmpty ? 'string' : unionType(dict.allNames)}`)

  const result = new Set<string>(['export type Tokens = {'])

  if (dict.isEmpty) {
    result.add('[token: string]: string')
  } else {
    for (const [key, value] of dict.categoryMap.entries()) {
      const typeName = capitalize(pluralize.singular(key))
      set.add(`export type ${typeName} = ${unionType(value.keys())}`)
      set.add(`export type ColorPalette = ${unionType(Object.keys(dict.colorPalettes))}`)
      result.add(`\t\t${key}: ${typeName}`)
    }
  }

  result.add('} & { [token: string]: never }')

  set.add(Array.from(result).join('\n'))

  return outdent.string(Array.from(set).join('\n\n'))
}
