import type { CompositionStyleObject } from './system-types'
import type { LiteralUnion, Recursive } from './shared'

type Cond = Record<string, string>

export type Token<Value = any> = {
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

export type TextStyle<Conditions extends Cond = {}> = CompositionStyleObject<Conditions, TextStyleProperty>

export type TextStyles<T extends Cond = {}> = Recursive<Token<TextStyle<T>>>

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

export type LayerStyle<Conditions extends Cond = {}> = CompositionStyleObject<Conditions, LayerStyleProperty>
export type LayerStyles<Conditions extends Cond = {}> = Recursive<Token<LayerStyle<Conditions>>>
