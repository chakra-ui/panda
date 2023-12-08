import type { Preset } from '@pandacss/types'
import { keyframes, semanticAnimations } from './keyframes'
import { tokens } from './tokens'

const definePreset = <T extends Preset>(config: T) => config

export const preset = definePreset({
  theme: {
    keyframes,
    tokens,
    semanticTokens: {
      animations: semanticAnimations,
    },

    breakpoints: {
      // Breakpoints
    },
  },

  utilities: {
    //* -- Mask -- Using -webkit-mask
    // MaskEdges and MaskCornerCuts
  },
  conditions: {
    // Media;
    // Supports;
  },
  globalCss: {
    // Layouts
  },
})

export default preset
