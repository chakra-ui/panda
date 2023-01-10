import type { Utility } from '@pandacss/core'
import { outdent } from 'outdent'

export function generatePropTypes(utility: Utility, strict?: boolean) {
  const result: string[] = [
    outdent`
    import { ConditionalValue } from './conditions';
    import { Properties as CSSProperties } from './csstype'
    import { Tokens } from './token'

    type PropValueTypes  = {`,
  ]

  const types = utility.getTypes()
  for (const [prop, values] of types.entries()) {
    result.push(`\t${prop}: ${values.join(' | ')};`)
  }

  result.push('}', '\n')

  result.push(`
  type NativeValue<T> = T extends keyof CSSProperties ? CSSProperties[T] : never
    
  type Shorthand<T> = T extends keyof PropValueTypes ? PropValueTypes[T] : NativeValue<T>
   
  export type PropTypes = PropValueTypes & {
  `)

  utility.shorthands.forEach((value, key) => {
    result.push(`\t${key}: Shorthand<${JSON.stringify(value)}>;`)
  })

  result.push('}')

  return outdent`
  ${result.join('\n')}

  export type PropValue<K extends string> = K extends keyof PropTypes
    ? ConditionalValue<PropTypes[K]${strict ? '' : ' | NativeValue<K>'}>
    : K extends keyof CSSProperties
    ? ConditionalValue<CSSProperties[K]>
    : never
  `
}
