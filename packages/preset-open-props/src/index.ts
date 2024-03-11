import type { Preset } from '@pandacss/types'
import { keyframes, semanticAnimations } from './keyframes'
import { breakpoints } from './breakpoints'
import { tokens } from './tokens'
import { utilities } from './utilities'
import { semanticShadows } from './shadows'

const definePreset = <T extends Preset>(config: T) => config

export const preset = definePreset({
  name: '@pandacss/open-props',
  theme: {
    keyframes,
    tokens,
    semanticTokens: {
      animations: semanticAnimations,
      shadows: semanticShadows,
    },

    breakpoints,
  },

  utilities,
})

export default preset
