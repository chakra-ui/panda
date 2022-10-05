import type { Utility } from '@css-panda/core'
import { outdent } from 'outdent'

export function generatePropertyTypes(utility: Utility) {
  // prettier-ignore
  const result: string[] = [
    outdent`
    import { Properties as CSSProperties } from "./csstype"

    type ValueTypes  = {`,
  ]

  const valueTypes = utility.valueTypes
  for (const [prop, values] of valueTypes.entries()) {
    result.push(`\t${prop}: ${values.join(' | ')};`)
  }

  result.push('}', '\n')

  result.push(`
   type Get<T> = T extends keyof ValueTypes ? ValueTypes[T] : T extends keyof CSSProperties ? CSSProperties[T] : string
   
   export type PropertyTypes = ValueTypes & {
  `)

  utility.shorthandMap.forEach((value, key) => {
    result.push(`\t${key}: Get<${JSON.stringify(value)}>;`)
  })

  result.push('}')

  return result.join('\n')
}
