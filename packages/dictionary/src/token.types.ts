export type TokenStatus = 'deprecated' | 'experimental' | 'new'

export type TokenEntry<V = any> = {
  value: V
  description?: string
  type?: string
  extensions?: {
    status?: TokenStatus
    [key: string]: any
  }
}

export type SemanticTokenEntry<V = string, C extends string = string> = {
  description?: string
  type?: string
  value: V | Record<C, V>
  extensions?: {
    [key: string]: any
  }
}

type Border = {
  color: string
  width: string
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

type Nested<T> = { [key: string]: T | Nested<T> }

export type TokenValues = {
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
  [key in keyof TokenValues]?: Nested<TokenEntry<TokenValues[key]>>
}

export type SemanticTokens<C extends string = string> = {
  [key in keyof TokenValues]?: Nested<SemanticTokenEntry<TokenValues[key], C>>
}

export type TokenCategory = keyof TokenValues

export {}
