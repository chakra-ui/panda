import type { Recursive } from './shared'
import type { CompositionStyleObject } from './system-types'

export type Token<Value = any> = {
  value: Value
  description?: string
}

/* -----------------------------------------------------------------------------
 * Text styles
 * -----------------------------------------------------------------------------*/

type TextStyleProperty =
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

export type TextStyle = CompositionStyleObject<TextStyleProperty>

export type TextStyles = Recursive<Token<TextStyle>>

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

type LayerStyleProperty =
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

export type LayerStyle = CompositionStyleObject<LayerStyleProperty>

export type LayerStyles = Recursive<Token<LayerStyle>>
