import type { PandaConditionalValue, Properties } from './panda-csstype'

export type Composition<V = any> = {
  value: V
  description?: string
}

type Nested<T> = {
  [key: string]: T | Nested<T>
}

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
  | (string & {})

type TCondition = Record<string, string>

type TextStyle<Conditions extends TCondition = TCondition> = {
  [K in TextStyleProperty]: PandaConditionalValue<Conditions, Properties[K]>
}

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
  | 'margin'
  | `margin${Placement}`
  | (string & {})

type LayerStyle<Conditions extends TCondition = TCondition> = {
  [K in LayerStyleProperty]: PandaConditionalValue<Conditions, Properties[K]>
}

export type TextStyles<Conditions extends TCondition = TCondition> = Nested<Composition<TextStyle<Conditions>>>

export type LayerStyles<Conditions extends TCondition = TCondition> = Nested<Composition<LayerStyle<Conditions>>>
