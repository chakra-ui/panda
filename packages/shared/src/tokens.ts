import type { TokenDataTypes } from '../../types/src/tokens'
// direct import to avoid circular dependency

type TokenType<T> = {
  [K in keyof T as K extends string ? Uppercase<K> : any]: K
}

export const TokenData = {
  ZINDICES: 'zIndices',
  OPACITIES: 'opacities',
  COLORS: 'colors',
  FONTS: 'fonts',
  FONTSIZES: 'fontSizes',
  FONTWEIGHTS: 'fontWeights',
  LINEHEIGHTS: 'lineHeights',
  LETTERSPACINGS: 'letterSpacings',
  SIZES: 'sizes',
  SHADOWS: 'shadows',
  SPACING: 'spacing',
  RADII: 'radii',
  BORDERS: 'borders',
  DURATIONS: 'durations',
  TRANSITIONS: 'transitions',
  EASINGS: 'easings',
  ANIMATIONS: 'animations',
  BLURS: 'blurs',
  GRADIENTS: 'gradients',
  ASSETS: 'assets',
  BORDERWIDTHS: 'borderWidths',
  ASPECTRATIOS: 'aspectRatios',
  CONTAINERNAMES: 'containerNames',
} as const satisfies TokenType<TokenDataTypes>
