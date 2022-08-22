import { defineConfig } from '@css-panda/types'
import { breakpoints } from './breakpoints'
import { conditions } from './conditions'
import { utilities } from './css-utility'
import { semanticTokens, tokens } from './tokens'

export const config = defineConfig({
  breakpoints,
  prefix: 'ab',
  tokens: tokens as any,
  semanticTokens: semanticTokens as any,
  conditions,
  utilities: [utilities],
})

export default config
