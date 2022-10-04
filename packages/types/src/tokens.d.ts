import type { Dict, DotPath } from './shared'

type RecommendedTokens = {
  colors: Record<string, string | Record<string, string>>
  fontSizes: Record<string, string>
  fontWeights: Record<string, string | number>
  fonts: Record<string, string | string[]>
  lineHeights: Record<string, string | number>
  letterSpacings: Record<string, string>
  radii: Record<string, string>
  blurs: Record<string, string>
  shadows: Record<string, string | string[]>
  dropShadows: Record<string, string | string[]>
  spacing: Record<string, string>
  sizes: Record<string, string>
  largeSizes: Record<string, string>
  animations: Record<string, string>
  easings: Record<string, string>
  durations: Record<string, string>
}

export type Tokens = RecommendedTokens & {
  [group: string]: Record<string, string | string[] | Record<string, string>>
}

export type PartialTokens = Partial<Tokens>

export type TokenCategory = keyof RecommendedTokens | (string & {})

type SemanticToken<Tokens extends PartialTokens = PartialTokens, Conditions = Dict, Breakpoints = Dict> = {
  [token: string]: {
    [P in keyof Conditions | keyof Breakpoints | '_' | 'base']?:
      | DotPath<Tokens[K]>
      | (string & {})
      | string[]
      | SemanticToken<Tokens, Conditions, Breakpoints>
  }
}

export type SemanticTokens<Tokens extends PartialTokens = PartialTokens, Conditions = Dict, Breakpoints = Dict> = {
  [K in keyof Tokens]?: SemanticToken<Tokens, Conditions, Breakpoints>
}
