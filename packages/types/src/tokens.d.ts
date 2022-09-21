type ShadowToken = {
  /**
   * The color of the shadow
   */
  color: string
  /**
   * The horizontal offset that shadow has from the element it is applied to.
   */
  offsetX: string
  /**
   * The vertical offset that shadow has from the element it is applied to
   */
  offsetY: string
  /**
   * The blur radius that is applied to the shadow
   */
  blur: string
  /**
   * The amount by which to expand or contract the shadow
   */
  spread: string
}

type Shadows = ShadowToken | ShadowToken[]

type RecommendedTokens = {
  colors: Record<string, string | Record<string, string>>
  fontSizes: Record<string, string>
  fontWeights: Record<string, string | number>
  fonts: Record<string, string>
  lineHeights: Record<string, string | number>
  letterSpacings: Record<string, string>
  radii: Record<string, string>
  blurs: Record<string, string>
  shadows: Record<string, string>
  dropShadows: Record<string, string>
  spacing: Record<string, string>
  sizes: Record<string, string>
  largeSizes: Record<string, string>
  animations: Record<string, string>
  easings: Record<string, string>
  durations: Record<string, string>
}

export type Tokens = RecommendedTokens & {
  [group: string]: Record<string, string | Record<string, string>>
}

export type PartialTokens = Partial<Tokens>

export type TokenCategory = keyof RecommendedTokens | (string & {})
