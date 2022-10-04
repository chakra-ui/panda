import type { Config } from '@css-panda/types'
import { breakpoints } from './breakpoints'
import { conditions } from './conditions'
import { keyframes } from './keyframes'
import { tokens } from './tokens'
import { utilities } from './utilities'
import { textStyles } from './typography'

export const config: Config = {
  breakpoints,
  tokens,
  conditions,
  keyframes,
  utilities,
  textStyles,
}

export { tokens, breakpoints, conditions, utilities, keyframes, textStyles }
