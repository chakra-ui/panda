import type { Recursive } from './shared'

export interface Token<Value = any> {
  value: Value
  description?: string
  type?: string
  deprecated?: boolean | string
  extensions?: {
    [key: string]: any
  }
}

type RecursiveToken<C extends string, V> =
  | V
  | {
      [K in C]: RecursiveToken<C, V>
    }

export interface SemanticToken<Value = string, Condition extends string = string>
  extends Token<RecursiveToken<Condition, Value>> {}

/* -----------------------------------------------------------------------------
 * Token data types
 * -----------------------------------------------------------------------------*/

type BorderStyle =
  | 'dashed'
  | 'dotted'
  | 'double'
  | 'groove'
  | 'hidden'
  | 'inset'
  | 'none'
  | 'outset'
  | 'ridge'
  | 'solid'

export interface Border {
  color: string
  width: string | number
  style: BorderStyle
}

export interface Shadow {
  offsetX: number
  offsetY: number
  blur: number
  spread: number
  color: string
  inset?: boolean
}

export interface Gradient {
  type: 'linear' | 'radial'
  placement: string | number
  stops:
    | Array<{
        color: string
        position: number
      }>
    | Array<string>
}

export interface Asset {
  type: 'url' | 'svg'
  value: string
}

export interface TokenDataTypes {
  zIndex: string | number
  opacity: string | number
  colors: string
  fonts: string | string[]
  fontSizes: string
  fontWeights: string | number
  lineHeights: string | number
  letterSpacings: string
  sizes: string
  shadows: Shadow | Shadow[] | string | string[]
  spacing: string | number
  radii: string
  borders: string | Border
  durations: string
  easings: string | number[]
  animations: string
  blurs: string
  gradients: string | Gradient
  assets: string | Asset
  borderWidths: string
  aspectRatios: string
  containerNames: string
}

export type DefaultTokenCategory = keyof TokenDataTypes
export type TokenCategory = DefaultTokenCategory | (string & {})

type UnknownTokenTypeValue = string | number

export type Tokens = {
  [key in TokenCategory]?: Recursive<
    Token<key extends DefaultTokenCategory ? TokenDataTypes[key] : UnknownTokenTypeValue>
  >
}

export type SemanticTokens<ConditionKey extends string = string> = {
  [key in TokenCategory]?: Recursive<
    SemanticToken<key extends DefaultTokenCategory ? TokenDataTypes[key] : UnknownTokenTypeValue, ConditionKey>
  >
}
