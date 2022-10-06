type Token<V> = {
  description?: string
  value: V
}

type SemanticToken<C extends string, V> =
  | {
      description?: string
      value: V
    }
  | {
      description?: string
      values: Record<C, string>
    }

type Shadow = {
  x: number
  y: number
  blur: number
  spread: number
  color: string
  inset?: boolean
}

type Border = {
  color: string
  width: string
  style: string
}

type Transition = {
  duration: string
  easing: string | string[]
  delay: string
}

type Nested<T> = { [key: string]: T | Nested<T> }

export type TokenValueTypes = {
  colors: string
  fonts: string | string[]
  fontSizes: string
  fontWeights: string | number
  lineHeights: string
  letterSpacings: string
  sizes: string | number
  shadows: Shadow | Shadow[] | string | string[]
  spacing: string | number
  radii: string
  borders: string | Border
  durations: string
  transitions: string | Transition
  easings: number[]
} & {
  [key: string]: string | string[]
}

export type Tokens = {
  [key in keyof TokenValueTypes]: Nested<Token<TokenValueTypes[key]>>
}

export type SemanticTokens<C extends string = string> = {
  [key in keyof TokenValueTypes]: Nested<SemanticToken<C, TokenValueTypes[key]>>
}
