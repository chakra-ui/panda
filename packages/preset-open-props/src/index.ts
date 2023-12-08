import type { Preset } from '@pandacss/types'
import { keyframes, semanticAnimations } from './keyframes'
import { breakpoints } from './breakpoints'
import { tokens } from './tokens'

const definePreset = <T extends Preset>(config: T) => config

export const preset = definePreset({
  theme: {
    keyframes,
    tokens,
    semanticTokens: {
      animations: semanticAnimations,
    },

    breakpoints,
  },

  utilities: {
    //* -- Mask -- Using -webkit-mask
    // MaskEdges and MaskCornerCuts
  },
  globalCss: {
    // Layouts
  },
})

export default preset
