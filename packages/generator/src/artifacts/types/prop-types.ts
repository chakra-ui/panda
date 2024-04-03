import type { Context } from '@pandacss/core'
import { outdent } from 'outdent'

export function generatePropTypes(ctx: Context) {
  const { utility } = ctx

  const result = [
    outdent`
    ${ctx.file.importType('Conditional', './conditions')}
    ${ctx.file.importType('CssProperties', './system-types')}
    ${ctx.file.importType('Tokens', '../tokens/index')}

    export interface UtilityValues {`,
  ]

  const types = utility.getTypes()

  for (const [prop, values] of types.entries()) {
    result.push(`\t${prop}: ${values.join(' | ')};`)
  }

  result.push('}', '\n')

  return outdent`
  ${result.join('\n')}

  type WithColorOpacityModifier<T> = T extends string ? \`$\{T}/\${string}\` : T

  type ImportantMark = "!" | "!important"
  type WhitespaceImportant = \` \${ImportantMark}\`
  type Important = ImportantMark | WhitespaceImportant
  type WithImportant<T extends U, U = any> = U extends string ? \`\${U}\${Important}\` & { __important?: true } : T;

  /**
   * Only relevant when using \`strictTokens\` or \`strictPropertyValues\` in your config.
   * - Allows you to use an escape hatch (e.g. \`[123px]\`) to use any string as a value.
   * - Allows you to use a color opacity modifier (e.g. \`red/300\`) with known color values.
   * - Allows you to use an important mark (e.g. \`!\` or \`!important\`) in the value.
   *
   * This is useful when you want to use a value that is not defined in the config or want to opt-out of the defaults.
   *
   * @example
   * css({
   *   fontSize: '[123px]', // ⚠️ will not throw even if you haven't defined 123px as a token
   * })
   *
   * @see https://panda-css.com/docs/concepts/writing-styles#stricttokens
   * @see https://panda-css.com/docs/concepts/writing-styles#strictpropertyvalues
   */
  export type WithEscapeHatch<T> = T | \`[\${string}]\` | (T extends string ? WithColorOpacityModifier<string> | WithImportant<T> : T)

  /**
   * Will restrict the value of properties that have predefined values to those values only.
   *
   * @example
   * css({
   *   display: 'abc', // ❌ will throw
   * })
   *
   * @see https://panda-css.com/docs/concepts/writing-styles#strictpropertyvalues
   */
  export type OnlyKnown<Key, Value> = Value extends boolean
    ? Value
    : Value extends \`\${infer _}\` ? Value : never
  `
}
