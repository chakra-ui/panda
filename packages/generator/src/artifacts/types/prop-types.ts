import type { Context } from '@pandacss/core'
import { outdent } from 'outdent'

export function generatePropTypes(ctx: Context) {
  const { utility } = ctx

  const result = [
    outdent`
    ${ctx.file.importType('Conditional', './conditions')}
    ${ctx.file.importType('CssProperties', './system-types')}
    ${ctx.file.importType('Tokens', '../tokens/index')}

    interface UtilityValues {`,
  ]

  const types = utility.getTypes()

  for (const [prop, values] of types.entries()) {
    result.push(`\t${prop}: ${values.join(' | ')};`)
  }

  result.push('}', '\n')

  return outdent`
  ${result.join('\n')}

  export type WithEscapeHatch<T> = T | \`[\${string}]\`

  type WithColorOpacityModifier<T> = T extends string ? \`$\{T}/\${string}\` : T

  type ImportantMark = "!" | "!important"
  type WhitespaceImportant = \` \${ImportantMark}\`
  type Important = ImportantMark | WhitespaceImportant
  type WithImportant<T> = T extends string ? \`\${T}\${Important}\${string}\` : T

  type WithEscapeHatch<T> = T | \`[\${string}]\` | (T extends string ? WithColorOpacityModifier<string> | WithImportant<T> : T)

  export type OnlyKnown<Key, Value> = Value extends boolean
    ? Value
    : Value extends \`\${infer _}\` ? Value : never
  `
}
