import type { Preset } from '@pandacss/types'
import { breakpoints } from './breakpoints'
import { colors } from './colors/core'
import { semanticColors } from './colors/semantic'
import { radii } from './radii'
import { semanticShadows } from './shadows'
import { spacing } from './spacing'
import { fontSizes, fontWeights, fonts, letterSpacings, lineHeights } from './typography'

const definePreset = <T extends Preset>(config: T) => config

export const preset = definePreset({
  theme: {
    breakpoints: breakpoints,
    tokens: {
      colors: colors,
      radii: radii,
      fontSizes: fontSizes,
      fontWeights: fontWeights,
      lineHeights: lineHeights,
      letterSpacings: letterSpacings,
      fonts: fonts,
      spacing: spacing,
    },
    semanticTokens: {
      colors: semanticColors,
      shadows: semanticShadows,
    },
  },
})

export default preset
