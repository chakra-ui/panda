import type { Utility } from '@css-panda/core'

export function generatePropertyTypes(utility: Utility) {
  const result: string[] = [
    'import { Properties as CSSProperties } from "./csstype"',
    '',
    'export type PropertyTypes  = {',
  ]

  const valueTypes = utility.valueTypes
  for (const [prop, values] of valueTypes.entries()) {
    result.push(`\t${prop}: ${values.join(' | ')};`)
  }

  result.push('}')
  return result.join('\n')
}
