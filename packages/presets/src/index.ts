import type { Config } from '@pandacss/types'
import { breakpoints } from './breakpoints'
import { conditions } from './conditions'
import { keyframes } from './keyframes'
import { tokens } from './tokens'
import { utilities } from './utilities'
import { patterns } from './patterns'
import { textStyles } from './typography'

const theme = {
  keyframes,
  breakpoints,
  tokens,
  textStyles,
}

export const config = {
  theme,
  conditions,
  utilities,
  patterns,
} satisfies Config

export default config
