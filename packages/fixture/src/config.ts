import presetBase from '@pandacss/preset-base'
import presetPanda from '@pandacss/preset-panda'
import type { PresetCore, Theme } from '@pandacss/types'

import { recipes } from './recipes'
import { slotRecipes } from './slot-recipes'
import { semanticTokens } from './semantic-tokens'

export const conditions = {
  ...presetBase.conditions,
  materialTheme: '[data-color=material] &',
  pastelTheme: '[data-color=pastel] &',
  dark: '[data-theme=dark] &, .dark &, &.dark, &[data-theme=dark]',
  light: '[data-theme=light] &, .light &, &.light, &[data-theme=light]',
}

const theme = presetPanda.theme
const tokens = {
  ...theme.tokens,
  colors: {
    ...theme.tokens?.colors,
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
} as Theme['tokens']

const textStyles = {
  headline: {
    h1: {
      value: {
        fontSize: '2rem',
        fontWeight: 'bold',
      },
    },
    h2: {
      value: {
        fontSize: { base: '1.5rem', lg: '2rem' },
        fontWeight: 'bold',
      },
    },
  },
}

export const fixturePreset: Omit<PresetCore, 'globalCss' | 'staticCss'> = {
  ...presetBase,
  conditions,
  theme: {
    ...theme,
    textStyles,
    tokens,
    semanticTokens,
    recipes,
    slotRecipes,
  },
}
