import { Dictionary } from '@css-panda/dictionary'
import { singular } from 'pluralize'

function union(values: IterableIterator<string>) {
  return Array.from(values)
    .map((v) => JSON.stringify(v))
    .join(' | ')
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function generateTokenDts(dict: Dictionary) {
  const set = new Set<string>()

  const interfaceSet = new Set<string>(['export interface Tokens {'])

  set.add(`export type Token = ${union(dict.values.keys())}`)

  for (const [key, value] of dict.categoryMap.entries()) {
    const typeName = capitalize(singular(key))
    set.add(`export type ${typeName} = ${union(value.keys())}`)
    interfaceSet.add(`\t\t${key}: ${typeName}`)
  }

  interfaceSet.add('}')

  set.add(Array.from(interfaceSet).join('\n'))

  return Array.from(set).join('\n\n')
}
