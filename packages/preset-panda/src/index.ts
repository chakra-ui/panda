import type { Preset } from '@pandacss/types'
import { breakpoints } from './breakpoints'
import { keyframes } from './keyframes'
import { tokens } from './tokens'
import { textStyles } from './typography'

const theme = {
  keyframes,
  breakpoints,
  tokens,
  textStyles,
}

export const preset: Preset = {
  theme,
}

export default preset
