import type { Properties } from './panda-csstype'

type TypographyProperties = Pick<
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

export type TextStyle = {
  [key: string]: TypographyProperties | TextStyle
}

type LayerProperties = Pick<
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

export type LayerStyle = {
  [key: string]: TypographyProperties | LayerStyle
}
