import type { Recursive } from './shared'

export type TokenStatus = 'deprecated' | 'experimental' | 'new'

export type Token<Value = any> = {
  value: Value
  description?: string
  type?: string
  extensions?: {
    status?: TokenStatus
    [key: string]: any
  }
}

type RecursiveToken<C extends string, V> =
  | V
  | {
      [K in C]: RecursiveToken<C, V>
    }

export type SemanticToken<Value = string, Condition extends string = string> = Token<RecursiveToken<Condition, Value>>

/* -----------------------------------------------------------------------------
 * Token data types
 * -----------------------------------------------------------------------------*/

type Border = {
  color: string
  width: string | number
  style: string
}

type Shadow = {
  offsetX: number
  offsetY: number
  blur: number
  spread: number
  color: string
  inset?: boolean
}

type Gradient = {
  type: 'linear' | 'radial'
  placement: string | number
  stops: Array<{
    color: string
    position: number
  }>
}

export type TokenDataTypes = {
  zIndex: number
  opacity: number
  colors: string
  fonts: string | string[]
  fontSizes: string
  fontWeights: string | number
  lineHeights: string | number
  letterSpacings: string
  sizes: string
  largeSizes: string
  shadows: Shadow | Shadow[] | string | string[]
  spacing: string | number
  radii: string
  borders: string | Border
  durations: string
  easings: string | number[]
  animations: string
  blurs: string
  gradients: string | Gradient
}

export type Tokens = {
  [key in keyof TokenDataTypes]?: Recursive<Token<TokenDataTypes[key]>>
}

export type SemanticTokens<ConditionKey extends string = string> = {
  [key in keyof TokenDataTypes]?: Recursive<SemanticToken<TokenDataTypes[key], ConditionKey>>
}

export type TokenCategory = keyof TokenDataTypes
