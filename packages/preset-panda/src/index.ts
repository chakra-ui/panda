import type { Preset } from '@pandacss/types'
import { breakpoints } from './breakpoints'
import { containers } from './containers'
import { keyframes } from './keyframes'
import { tokens } from './tokens'
import { textStyles } from './typography'

const definePreset = <T extends Preset>(config: T) => config

export const preset = definePreset({
  name: '@pandacss/preset-panda',
  theme: {
    keyframes,
    breakpoints,
    tokens,
    textStyles,
    containers,
  },
})

export default preset
