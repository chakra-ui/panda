import presetBase from '@pandacss/preset-base'
import presetPanda from '@pandacss/preset-panda'
import type { Config } from '@pandacss/types'

import { recipes } from './recipes'
import { semanticTokens } from './semantic-tokens'
import { slotRecipes } from './slot-recipes'

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

export const fixturePreset: Config = {
  presets: [presetBase, presetPanda],
  conditions: {
    materialTheme: '[data-color=material] &',
    pastelTheme: '[data-color=pastel] &',
    dark: '[data-theme=dark] &, .dark &, &.dark, &[data-theme=dark]',
    light: '[data-theme=light] &, .light &, &.light, &[data-theme=light]',
  },
  theme: {
    textStyles,
    tokens: {
      colors: {
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
    },
    semanticTokens,
    recipes,
    slotRecipes,
  },
}
