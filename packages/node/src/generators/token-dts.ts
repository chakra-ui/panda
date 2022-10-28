import type { TokenDictionary } from '@css-panda/token-dictionary'
import { unionType, capitalize } from '@css-panda/shared'
import { outdent } from 'outdent'
import { singular } from 'pluralize'

export function generateTokenDts(dict: TokenDictionary) {
  const set = new Set<string>()

  set.add(`export type Token = ${dict.isEmpty ? 'string' : unionType(dict.allNames)}`)

  const interfaceSet = new Set<string>(['export interface Tokens {'])

  if (dict.isEmpty) {
    interfaceSet.add('[token: string]: string')
  } else {
    for (const [key, value] of dict.categoryMap.entries()) {
      const typeName = capitalize(singular(key))
      set.add(`export type ${typeName} = ${unionType(value.keys())}`)
      set.add(`export type Palette = ${unionType(Object.keys(dict.palettes))}`)
      interfaceSet.add(`\t\t${key}: ${typeName}`)
    }
  }

  interfaceSet.add('}')

  set.add(Array.from(interfaceSet).join('\n'))

  return outdent.string(Array.from(set).join('\n\n'))
}
