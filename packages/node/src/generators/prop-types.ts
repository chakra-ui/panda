import type { Utility } from '@pandacss/core'
import { outdent } from 'outdent'

export function generatePropTypes(utility: Utility, strict?: boolean) {
  const strictText = `${strict ? '' : ' | NativeValue<T>'}`
  const result: string[] = [
    outdent`
    import type { ConditionalValue } from './conditions';
    import type { Properties as CSSProperties } from './csstype'
    import type { Tokens } from './token'

    type PropertyValueTypes  = {`,
  ]

  const types = utility.getTypes()
  for (const [prop, values] of types.entries()) {
    result.push(`\t${prop}: ${values.join(' | ')};`)
  }

  result.push('}', '\n')

  result.push(`
  type NativeValue<T> = T extends keyof CSSProperties ? CSSProperties[T] : never
    
  type Shorthand<T> = T extends keyof PropertyValueTypes ? PropertyValueTypes[T]${strictText} : NativeValue<T>
   
  export type PropertyTypes = PropertyValueTypes & {
  `)

  utility.shorthands.forEach((value, key) => {
    result.push(`\t${key}: Shorthand<${JSON.stringify(value)}>;`)
  })

  result.push('}')

  return outdent`
  ${result.join('\n')}

  export type PropertyValue<T extends string> = T extends keyof PropertyTypes
    ? ConditionalValue<PropertyTypes[T]${strictText}>
    : T extends keyof CSSProperties
    ? ConditionalValue<CSSProperties[T]>
    : ConditionalValue<string | number>
  `
}
