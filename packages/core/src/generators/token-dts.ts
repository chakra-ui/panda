import type { Dictionary } from '@css-panda/dictionary'
import { unionType } from '@css-panda/shared'
import { singular } from 'pluralize'

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function generateTokenDts(dict: Dictionary) {
  const set = new Set<string>()

  const interfaceSet = new Set<string>(['export interface Tokens {'])

  set.add(`export type Token = ${unionType(dict.values.keys())}`)

  for (const [key, value] of dict.categoryMap.entries()) {
    const typeName = capitalize(singular(key))
    set.add(`export type ${typeName} = ${unionType(value.keys())}`)
    interfaceSet.add(`\t\t${key}: ${typeName}`)
  }

  interfaceSet.add('}')

  set.add(Array.from(interfaceSet).join('\n'))

  return Array.from(set).join('\n\n')
}
