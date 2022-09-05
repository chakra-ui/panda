import type { Dictionary } from '@css-panda/dictionary'
import { unionType } from '@css-panda/shared'
import { outdent } from 'outdent'
import { singular } from 'pluralize'

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function generateTokenDts(dict: Dictionary) {
  const set = new Set<string>()

  set.add(`export type Token = ${dict.isEmpty ? 'string' : unionType(dict.values.keys())}`)

  const interfaceSet = new Set<string>(['export interface Tokens {'])

  if (dict.isEmpty) {
    interfaceSet.add('[token: string]: string')
  } else {
    for (const [key, value] of dict.categoryMap.entries()) {
      const typeName = capitalize(singular(key))
      set.add(`export type ${typeName} = ${unionType(value.keys())}`)
      interfaceSet.add(`\t\t${key}: ${typeName}`)
    }
  }

  interfaceSet.add('}')

  set.add(Array.from(interfaceSet).join('\n'))

  return outdent.string(Array.from(set).join('\n\n'))
}
