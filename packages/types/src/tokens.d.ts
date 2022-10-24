interface TokenMeta {
  deprecated?: boolean
  public?: boolean
  source?: string
  [key: string]: string | boolean | number
}

export type Token<V = any> = {
  description?: string
  value: V
  meta?: TokenMeta
}

export type SemanticToken<V = string, C extends string = string> = {
  description?: string
  value: V | Record<C, V>
}

type Border = {
  color: string
  width: string
  style: string
}

type Shadow = {
  x: number
  y: number
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

export type TokenEntries = {
  [K in keyof TokenValues]: [K, TokenValues[K]]
}[keyof TokenValues]

export type Tokens = {
  [key in keyof TokenValues]?: Nested<Token<TokenValues[key]>>
}

export type SemanticTokens<C extends string = string> = {
  [key in keyof TokenValues]?: Nested<SemanticToken<TokenValues[key], C>>
}

export type TokenCategory = keyof TokenValues
