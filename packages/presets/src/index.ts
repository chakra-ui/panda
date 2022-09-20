import type { Config } from '@css-panda/types'
import { breakpoints } from './breakpoints'
import { conditions } from './conditions'
import { keyframes } from './keyframes'
import { tokens } from './tokens'
import { utilities } from './utilities'

export const config: Config = {
  breakpoints,
  tokens,
  conditions,
  keyframes,
  utilities,
}

export { tokens, breakpoints, conditions, utilities, keyframes }
