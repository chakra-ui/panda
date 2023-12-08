import type { Tokens } from '@pandacss/types'
import { colors } from './colors'
import { zIndex } from './zIndex'
import { assets } from './assets'
import { gradients } from './gradients'
import { animations, easings } from './keyframes'
import { borderWidths, radii } from './borders'
import { shadows } from './shadows'
import { sizes, spacing } from './sizes'
import { fonts, fontSizes, fontWeights, letterSpacings, lineHeights } from './typography'

const defineTokens = <T extends Tokens>(v: T) => v

export const tokens = defineTokens({
  borderWidths,
  radii,
  easings,
  zIndex,
  letterSpacings,
  fonts,
  lineHeights,
  fontWeights,
  fontSizes,
  shadows,
  assets,
  gradients,
  colors,
  spacing,
  sizes,
  animations,
})
