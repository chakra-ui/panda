export type Tokens = {
  colors: Record<string, string | Record<string, string>>
  fontSizes: Record<string, string>
  fontWeights: Record<string, string | number>
  fonts: Record<string, string>
  lineHeights: Record<string, string | number>
  letterSpacings: Record<string, string>
  radii: Record<string, string>
  shadows: Record<string, string>
  dropShadows: Record<string, string>
  spacing: Record<string, string>
  sizes: Record<string, string>
  largeSizes: Record<string, string>
  opacity: Record<string, string>
  animations: Record<string, string>
  easings: Record<string, string>
  durations: Record<string, string>
  [group: string]: Record<string, string | Record<string, string>>
}

export type PartialTokens = Partial<Tokens>

export type TokenCategory = keyof Tokens
