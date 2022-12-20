import type { Config } from '@pandacss/types'
import { breakpoints } from './breakpoints'
import { conditions } from './conditions'
import { keyframes } from './keyframes'
import { tokens } from './tokens'
import { utilities } from './utilities'
import { patterns } from './patterns'
import { textStyles } from './typography'

export const config: Config = {
  theme: {
    keyframes,
    breakpoints,
    tokens,
    textStyles,
  },
  conditions,
  utilities,
  patterns,
}

export { tokens, breakpoints, conditions, utilities, keyframes, textStyles, patterns }

export default config
