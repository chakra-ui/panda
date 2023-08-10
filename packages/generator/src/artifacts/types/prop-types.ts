import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generatePropTypes(ctx: Context) {
  const {
    config: { strictTokens },
    utility,
  } = ctx

  const strictText = `${strictTokens ? '' : ' | CssValue<T>'}`

  const result: string[] = [
    outdent`
    import type { ConditionalValue } from './conditions';
    import type { CssProperties } from './system-types'
    import type { Tokens } from '../tokens'

    type PropertyValueTypes  = {`,
  ]

  const types = utility.getTypes()

  for (const [prop, values] of types.entries()) {
    result.push(`\t${prop}: ${values.join(' | ')};`)
  }

  result.push('}', '\n')

  result.push(`
  type CssValue<T> = T extends keyof CssProperties ? CssProperties[T] : never

  type Shorthand<T> = T extends keyof PropertyValueTypes ? PropertyValueTypes[T]${strictText} : CssValue<T>

  export type PropertyTypes = PropertyValueTypes & {
  `)

  utility.shorthands.forEach((value, key) => {
    result.push(`\t${key}: Shorthand<${JSON.stringify(value)}>;`)
  })

  result.push('}')

  return outdent`
  ${result.join('\n')}

  export type PropertyValue<T extends string> = T extends keyof PropertyTypes
    ? ConditionalValue<PropertyTypes[T]${strictText} | (string & {})>
    : T extends keyof CssProperties
    ? ConditionalValue<CssProperties[T] | (string & {})>
    : ConditionalValue<string | number>
  `
}
