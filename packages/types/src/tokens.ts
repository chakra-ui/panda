export type FontSizePairing = {
  fontSize?: string;
  lineHeight?: string;
  letterSpacing?: string;
  fontWeight?: string | number;
};

export type Tokens = {
  colors: Record<string, string | Record<string, string>>;
  fontSizes: Record<string, string | FontSizePairing>;
  fontWeights: Record<string, string | number>;
  fonts: Record<string, string>;
  lineHeights: Record<string, string>;
  letterSpacings: Record<string, string>;
  radii: Record<string, string>;
  shadows: Record<string, string>;
  spacing: Record<string, string>;
  sizes: Record<string, string>;
  largeSizes: Record<string, string>;
  opacity: Record<string, string>;
  animations: Record<string, string>;
  transitionProperties: Record<string, string>;
  easings: Record<string, string>;
  durations: Record<string, string>;
};
