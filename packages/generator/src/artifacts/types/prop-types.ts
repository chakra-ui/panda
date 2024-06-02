import { ArtifactFile } from '../artifact'

export const typesPropTypesArtifact = new ArtifactFile({
  id: 'types/prop-type.d.ts',
  fileName: 'prop-types',
  type: 'dts',
  dir: (ctx) => ctx.paths.types,
  dependencies: ['utilities'],
  importsType: {
    'types/conditions.d.ts': ['ConditionalValue'],
    'types/system-types.d.ts': ['CssProperties'],
    'tokens/index.d.ts': ['Tokens'],
  },
  computed(ctx) {
    return { utility: ctx.utility }
  },
  code(params) {
    const { utility } = params.computed

    const result = [`export interface UtilityValues {`]

    const types = utility.getTypes()

    for (const [prop, values] of types.entries()) {
      result.push(`\t${prop}: ${values.join(' | ')};`)
    }

    result.push('}', '\n')

    return `
  ${result.join('\n')}

  type WithColorOpacityModifier<T> = T extends string ? \`$\{T}/\${string}\` : T

  type ImportantMark = "!" | "!important"
  type WhitespaceImportant = \` \${ImportantMark}\`
  type Important = ImportantMark | WhitespaceImportant
  type WithImportant<T> = T extends string ? \`\${T}\${Important}\` & { __important?: true } : T;

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
  },
})
