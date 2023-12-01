import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generatePropTypes(ctx: Context) {
  const {
    config: { strictTokens },
    utility,
  } = ctx

  const result = [
    outdent`
    ${ctx.file.importType('ConditionalValue', './conditions')}
    ${ctx.file.importType('CssProperties', './system-types')}
    ${ctx.file.importType('Tokens', '../tokens/index')}

    interface PropertyValueTypes {`,
  ]

  const types = utility.getTypes()

  for (const [prop, values] of types.entries()) {
    result.push(`\t${prop}: ${values.join(' | ')};`)
  }

  result.push('}', '\n')

  result.push(`
  type CssValue<T> = T extends keyof CssProperties ? CssProperties[T] : never

  type Shorthand<T> = T extends keyof PropertyValueTypes ? PropertyValueTypes[T]${
    strictTokens ? '' : ' | CssValue<T>'
  } : CssValue<T>

  export interface PropertyTypes extends PropertyValueTypes {
  `)

  utility.shorthands.forEach((value, key) => {
    result.push(`\t${key}: Shorthand<${JSON.stringify(value)}>;`)
  })

  result.push('}')

  return outdent`
  ${result.join('\n')}

  ${strictTokens ? `type FilterString<T> = T extends \`\${infer _}\` ? T : never;` : ''}
  export type PropertyValue<T extends string> = T extends keyof PropertyTypes
    ? ConditionalValue<${
      strictTokens ? 'FilterString<PropertyTypes[T]>' : 'PropertyTypes[T] | CssValue<T> | (string & {})'
    }>
    : T extends keyof CssProperties
    ? ConditionalValue<${strictTokens ? 'FilterString<CssProperties[T]>' : 'CssProperties[T] | (string & {})'}>
    : ConditionalValue<string | number>
  `
}
