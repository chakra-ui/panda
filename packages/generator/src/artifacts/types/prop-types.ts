import type { Context } from '@pandacss/core'
import { unionType } from '@pandacss/shared'
import { outdent } from 'outdent'
import { match } from 'ts-pattern'

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

  const cssVars = ctx.globalVars
  const withCssVars = !cssVars.isEmpty() ? ' | CssVars' : ''

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

  ${
    !cssVars.isEmpty()
      ? outdent`
  type CssVars = ${unionType(cssVars.vars)}
  `
      : ''
  }

  type StrictableProps =
    | 'alignContent'
    | 'alignItems'
    | 'alignSelf'
    | 'all'
    | 'animationComposition'
    | 'animationDirection'
    | 'animationFillMode'
    | 'appearance'
    | 'backfaceVisibility'
    | 'backgroundAttachment'
    | 'backgroundClip'
    | 'borderCollapse'
    | 'borderBlockEndStyle'
    | 'borderBlockStartStyle'
    | 'borderBlockStyle'
    | 'borderBottomStyle'
    | 'borderInlineEndStyle'
    | 'borderInlineStartStyle'
    | 'borderInlineStyle'
    | 'borderLeftStyle'
    | 'borderRightStyle'
    | 'borderTopStyle'
    | 'boxDecorationBreak'
    | 'boxSizing'
    | 'breakAfter'
    | 'breakBefore'
    | 'breakInside'
    | 'captionSide'
    | 'clear'
    | 'columnFill'
    | 'columnRuleStyle'
    | 'contentVisibility'
    | 'direction'
    | 'display'
    | 'emptyCells'
    | 'flexDirection'
    | 'flexWrap'
    | 'float'
    | 'fontKerning'
    | 'forcedColorAdjust'
    | 'isolation'
    | 'lineBreak'
    | 'mixBlendMode'
    | 'objectFit'
    | 'outlineStyle'
    | 'overflow'
    | 'overflowX'
    | 'overflowY'
    | 'overflowBlock'
    | 'overflowInline'
    | 'overflowWrap'
    | 'pointerEvents'
    | 'position'
    | 'resize'
    | 'scrollBehavior'
    | 'touchAction'
    | 'transformBox'
    | 'transformStyle'
    | 'userSelect'
    | 'visibility'
    | 'wordBreak'
    | 'writingMode'

  type WithColorOpacityModifier<T> = T extends string ? \`$\{T}/\${string}\` : T
  type WithEscapeHatch<T> = T | \`[\${string}]\` | \`\${T}/{string}\` | WithColorOpacityModifier<T>

  type FilterVagueString<Key, Value> = Value extends boolean
    ? Value
    : Key extends StrictableProps
      ? Value extends \`\${infer _}\` ? Value : never
      : Value

  type PropOrCondition<Key, Value> = ${match(ctx.config)
    .with(
      { strictTokens: true, strictPropertyValues: true },
      () => `ConditionalValue<WithEscapeHatch<FilterVagueString<Key, Value>>${withCssVars}>`,
    )
    .with({ strictTokens: true }, () => `ConditionalValue<WithEscapeHatch<Value>${withCssVars}>`)
    .with(
      { strictPropertyValues: true },
      () => `ConditionalValue<WithEscapeHatch<FilterVagueString<Key, Value>>${withCssVars}>`,
    )
    .otherwise(() => `ConditionalValue<Value | (string & {})${withCssVars}>`)}

  type PropertyTypeValue<T extends string> = T extends keyof PropertyTypes
    ? PropOrCondition<T, ${match(ctx.config)
      .with(
        { strictPropertyValues: true, strictTokens: true },
        () => 'T extends StrictableProps ? PropertyTypes[T] : PropertyTypes[T]',
      )
      .with({ strictTokens: true }, () => 'PropertyTypes[T]')
      .with(
        { strictPropertyValues: true },
        () => 'T extends StrictableProps ? PropertyTypes[T] : PropertyTypes[T] | CssValue<T>',
      )

      .otherwise(() => 'PropertyTypes[T] | CssValue<T>')}>
    : never;

  type CssPropertyValue<T extends string> = T extends keyof CssProperties
    ? PropOrCondition<T, CssProperties[T]>
    : never;

  export type PropertyValue<T extends string> = T extends keyof PropertyTypes
    ? PropertyTypeValue<T>
    : T extends keyof CssProperties
      ? CssPropertyValue<T>
      : PropOrCondition<T, string | number>
  `
}
