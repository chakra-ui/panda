import { createVisibilityFilter, type Context } from '@pandacss/core'
import { outdent } from 'outdent'

export function generatePropTypes(ctx: Context) {
  const { utility, tokens } = ctx
  const isHidden = createVisibilityFilter(ctx.config)

  const result = [
    outdent`
    ${ctx.file.importType('ConditionalValue', './conditions')}
    ${ctx.file.importType('CssProperties', './system-types')}
    ${ctx.file.importType('Tokens', '../tokens/index')}

    export interface UtilityValues {`,
  ]

  // Match `generateTokenTypes`: a palette is hidden only when EVERY real member
  // is hidden. Mirror the same membership logic so the `colorPalette` prop
  // union stays in sync with the `ColorPalette` token type.
  const colorsCategory = tokens.view.categoryMap.get('colors' as any)
  const tokenBelongsToPalette = (token: any, paletteKey: string): boolean => {
    const ext = token?.extensions
    if (!ext || ext.isVirtual) return false
    const roots: string[][] | undefined = ext.colorPaletteRoots
    if (!roots) return false
    return roots.some((root) => root.join('.') === paletteKey)
  }
  const isHiddenPalette = (paletteKey: string): boolean => {
    if (!colorsCategory) return false
    let hasMember = false
    for (const [tokenKey, token] of colorsCategory.entries()) {
      if (!tokenBelongsToPalette(token, paletteKey)) continue
      hasMember = true
      const field = token.extensions?.isSemantic ? 'semanticTokens' : 'tokens'
      if (!isHidden(field, `colors.${tokenKey}`)) return false
    }
    return hasMember
  }

  const types = utility.getTypes()

  for (const [prop, values] of types.entries()) {
    let propValues = values
    if (prop === 'colorPalette') {
      propValues = values.filter((value) => {
        // Values are JSON-stringified literal unions like `"accent"`.
        if (value.length < 2 || value[0] !== '"') return true
        return !isHiddenPalette(value.slice(1, -1))
      })
      if (propValues.length === 0) continue
    }
    result.push(`\t${prop}: ${propValues.join(' | ')};`)
  }

  result.push('}', '\n')

  return outdent`
  ${result.join('\n')}

  type WithColorOpacityModifier<T> = [T] extends [string] ? \`$\{T}/\${string}\` & { __colorOpacityModifier?: true } : never

  type ImportantMark = "!" | "!important"
  type WhitespaceImportant = \` \${ImportantMark}\`
  type Important = ImportantMark | WhitespaceImportant
  type WithImportant<T> = [T] extends [string] ? \`\${T}\${Important}\` & { __important?: true } : never

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
  export type WithEscapeHatch<T> = T | \`[\${string}]\` | WithColorOpacityModifier<T> | WithImportant<T>

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
