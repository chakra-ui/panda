import type { Preset } from '@pandacss/types'
import { breakpoints } from './breakpoints'
import { keyframes } from './keyframes'
import { tokens } from './tokens'
import { textStyles } from './typography'

const definePreset = <T extends Preset>(config: T) => config

export const preset = definePreset({
  theme: {
    keyframes,
    breakpoints,
    tokens,
    textStyles,
  },
})

export default preset
