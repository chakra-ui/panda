import type { Config } from '@pandacss/types'
import { breakpoints } from './breakpoints'
import { conditions } from './conditions'
import { utilities } from './utility'
import { keyframes } from './keyframes'
import { patterns } from './pattern'
import { recipes } from './recipes'
import { semanticTokens, tokens } from './tokens'

export const config: Config = {
  cssVarPrefix: 'pd',
  theme: {
    tokens,
    breakpoints,
    keyframes,
    semanticTokens,
    recipes,
  },
  conditions,
  utilities,
  patterns,
}
