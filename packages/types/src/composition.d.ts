import type { Properties } from './panda-csstype'

type Token<V = any> = {
  description?: string
  value: V
}

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
>

type LayerStyle = Pick<
  Properties,
  | 'background'
  | 'backgroundColor'
  | 'backgroundImage'
  | 'borderRadius'
  | 'border'
  | 'boxShadow'
  | 'opacity'
  | 'backgroundBlendMode'
>

export type TextStyles = Nested<Token<TextStyle>>

export type LayerStyles = Nested<Token<LayerStyle>>
