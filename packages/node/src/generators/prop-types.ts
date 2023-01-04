import type { Utility } from '@pandacss/core'
import { outdent } from 'outdent'

export function generatePropTypes(utility: Utility) {
  const result: string[] = [
    outdent`
    import { Properties as CSSProperties } from './csstype'
    import { Tokens } from './token'

    type BasePropTypes  = {`,
  ]

  const types = utility.getTypes()
  for (const [prop, values] of types.entries()) {
    result.push(`\t${prop}: ${values.join(' | ')};`)
  }

  result.push('}', '\n')

  result.push(`
  type CssProp<T> = T extends keyof CSSProperties ? CSSProperties[T] : never
  
  type BaseProp<T> = T extends keyof BasePropTypes ? BasePropTypes[T] : never
  
  type Shorthand<T> = CssProp<T> | BaseProp<T>
   
  export type PropTypes = BasePropTypes & {
  `)

  utility.shorthands.forEach((value, key) => {
    result.push(`\t${key}: Shorthand<${JSON.stringify(value)}>;`)
  })

  result.push('}')

  return result.join('\n')
}
