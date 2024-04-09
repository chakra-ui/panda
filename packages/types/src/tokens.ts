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

export type Tokens = {
  [key in keyof TokenDataTypes]?: Recursive<Token<TokenDataTypes[key]>>
}

export type SemanticTokens<ConditionKey extends string = string> = {
  [key in keyof TokenDataTypes]?: Recursive<SemanticToken<TokenDataTypes[key], ConditionKey>>
}

export type TokenCategory = keyof TokenDataTypes
