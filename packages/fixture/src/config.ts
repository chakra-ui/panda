import type { Config } from '@pandacss/types'
import { config as preset } from '@pandacss/presets'

import { semanticTokens } from './semantic-tokens'
import { recipes } from './recipes'

export const { theme, utilities, patterns } = preset
export const { breakpoints, keyframes } = theme

export const conditions = {
  ...preset.conditions,
  materialTheme: '[data-color=material] &',
  pastelTheme: '[data-color=pastel] &',
}

export const tokens = {
  ...preset.theme.tokens,
  colors: {
    ...preset.theme.tokens.colors,
    deep: {
      test: {
        yam: {
          value: '%555',
        },
        pool: {
          poller: {
            value: '#fff',
          },
          tall: {
            value: '$dfdf',
          },
        },
      },
    },
  },
}

export const config = {
  ...preset,
  theme: {
    ...preset.theme,
    tokens,
    semanticTokens,
    recipes,
  },
} satisfies Config
