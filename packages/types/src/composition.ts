import type { Conditional, NativeCssProperties, NestedCss } from './system-types'
import type { LiteralUnion, Primitive, Recursive } from './shared'

export type Composition<Value = any> = {
  value: Value
  description?: string
}

/* -----------------------------------------------------------------------------
 * Text styles
 * -----------------------------------------------------------------------------*/

type TextStyleProperty = LiteralUnion<
  | 'fontSize'
  | 'fontSizeAdjust'
  | 'fontVariationSettings'
  | 'fontVariantPosition'
  | 'fontVariantCaps'
  | 'fontVariantNumeric'
  | 'fontVariantAlternates'
  | 'fontVariantLigatures'
  | 'fontFamily'
  | 'fontWeight'
  | 'fontSynthesis'
  | 'fontStyle'
  | 'fontVariant'
  | 'lineHeight'
  | 'letterSpacing'
  | 'textDecoration'
  | 'textTransform'
  | 'textIndent'
  | 'textDecorationColor'
  | 'textDecorationLine'
  | 'textDecorationStyle'
  | 'textEmphasisColor'
  | 'textEmphasisPosition'
  | 'textEmphasisStyle'
  | 'hyphenateCharacter'
  | 'textOrientation'
  | 'textOverflow'
  | 'textRendering'
>

type TCondition = Record<string, string>

export type TextStyle<T extends TCondition = TCondition> = NestedCss<{
  [K in TextStyleProperty]?: Conditional<T, K extends keyof NativeCssProperties ? NativeCssProperties[K] : Primitive>
}>

export type TextStyles<T extends TCondition = TCondition> = Recursive<Composition<TextStyle<T>>>

/* -----------------------------------------------------------------------------
 * Layer styles
 * -----------------------------------------------------------------------------*/

type Placement =
  | 'Top'
  | 'Right'
  | 'Bottom'
  | 'Left'
  | 'Inline'
  | 'Block'
  | 'InlineStart'
  | 'InlineEnd'
  | 'BlockStart'
  | 'BlockEnd'

type Radius =
  | `Top${'Right' | 'Left' | 'Start' | 'End'}`
  | `Bottom${'Right' | 'Left' | 'Start' | 'End'}`
  | `Start${'Start' | 'End'}`
  | `End${'Start' | 'End'}`

type LayerStyleProperty = LiteralUnion<
  | 'background'
  | 'backgroundColor'
  | 'backgroundImage'
  | 'borderRadius'
  | 'border'
  | 'borderWidth'
  | 'borderColor'
  | 'borderStyle'
  | 'boxShadow'
  | 'filter'
  | 'backdropFilter'
  | 'transform'
  | 'color'
  | 'opacity'
  | 'backgroundBlendMode'
  | 'backgroundAttachment'
  | 'backgroundClip'
  | 'backgroundOrigin'
  | 'backgroundPosition'
  | 'backgroundRepeat'
  | 'backgroundSize'
  | `border${Placement}`
  | `border${Placement}Width`
  | `border${Radius}Radius`
  | `border${Placement}Color`
  | `border${Placement}Style`
  | 'padding'
  | `padding${Placement}`
>

export type LayerStyle<Conditions extends TCondition = TCondition> = NestedCss<{
  [K in LayerStyleProperty]?: Conditional<
    Conditions,
    K extends keyof NativeCssProperties ? NativeCssProperties[K] : Primitive
  >
}>

export type LayerStyles<Conditions extends TCondition = TCondition> = Recursive<Composition<LayerStyle<Conditions>>>
