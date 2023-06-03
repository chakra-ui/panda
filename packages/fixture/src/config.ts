import type { Config, Tokens } from '@pandacss/types'
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

export const tokens: Tokens = {
  ...(preset.theme.tokens as Tokens),
  colors: {
    ...(preset.theme.tokens as Tokens).colors,
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

export const config: Config = {
  ...preset,
  theme: {
    ...preset.theme,
    tokens,
    semanticTokens,
    recipes,
  },
}
