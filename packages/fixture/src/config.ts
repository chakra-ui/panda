import type { Config } from '@pandacss/types'
import { config as preset } from '@pandacss/presets'

import { semanticTokens } from './semantic-tokens'
import { recipes } from './recipes'

export const { theme, conditions, utilities, patterns } = preset
export const { breakpoints, keyframes, tokens } = theme

export const config = {
  ...preset,
  theme: {
    ...preset.theme,
    semanticTokens,
    recipes,
  },
} satisfies Config
