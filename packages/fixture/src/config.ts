import type { Config } from '@css-panda/types'
import { breakpoints } from './breakpoints'
import { conditions } from './conditions'
import { utilities } from './css-utility'
import { keyframes } from './keyframes'
import { patterns } from './pattern'
import { recipes } from './recipes'
import { semanticTokens, tokens } from './tokens'

export const config: Config = {
  breakpoints,
  prefix: 'pd',
  keyframes,
  tokens,
  semanticTokens,
  conditions,
  utilities,
  recipes,
  patterns,
}
