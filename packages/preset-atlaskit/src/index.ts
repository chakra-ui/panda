import type { Preset } from '@pandacss/types'
import { breakpoints } from './breakpoints'
import { colors } from './colors/core'
import { semanticColors } from './colors/semantic'
import { opacity } from './opacity'
import { radii } from './radii'
import { semanticShadows } from './shadows'
import { spacing } from './spacing'
import { fontSizes } from './typography/sizes'
import { fonts } from './typography/fonts'
import { fontWeights } from './typography/weights'
import { lineHeights } from './typography/lineHeights'
import { textStyles } from './textStyles'
import { durations } from './durations'
import { easings } from './easings'

const definePreset = <T extends Preset>(config: T) => config

export const preset = definePreset({
  name: '@pandacss/preset-atlaskit',
  theme: {
    breakpoints: breakpoints,
    tokens: {
      colors: colors,
      opacity: opacity,
      radii: radii,
      fontSizes: fontSizes,
      fontWeights: fontWeights,
      lineHeights: lineHeights,
      fonts: fonts,
      spacing: spacing,
      durations: durations,
      easings: easings,
    },
    semanticTokens: {
      colors: semanticColors,
      shadows: semanticShadows,
    },
    textStyles: textStyles,
  },
})

export default preset
