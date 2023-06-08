import type { Config } from '@pandacss/types'
import { breakpoints } from './breakpoints'
import { keyframes } from './keyframes'
import { tokens } from './tokens'
import { textStyles } from './typography'

const defineConfig = <T extends Config>(config: T) => config

export const preset = defineConfig({
  theme: {
    keyframes,
    breakpoints,
    tokens,
    textStyles,
  },
})

export default preset
