import type { Properties } from './panda-csstype'
import type { Token } from './tokens'

type Nested<T> = { [key: string]: T | Nested<T> }

type TextStyle = Pick<
  Properties,
  | 'fontSize'
  | 'fontWeight'
  | 'lineHeight'
  | 'letterSpacing'
  | 'fontFamily'
  | 'textDecoration'
  | 'fontVariant'
  | 'fontStyle'
  | 'textTransform'
  | 'textIndent'
>

type LayerStyle = Pick<
  Properties,
  | 'background'
  | 'backgroundColor'
  | 'backgroundImage'
  | 'borderRadius'
  | 'border'
  | 'borderWidth'
  | 'borderColor'
  | 'boxShadow'
  | 'opacity'
  | 'backgroundBlendMode'
>

export type TextStyles = Nested<Token<TextStyle>>

export type LayerStyles = Nested<Token<LayerStyle>>
