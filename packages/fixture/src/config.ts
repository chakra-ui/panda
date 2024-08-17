import presetBase from '@pandacss/preset-base'
import presetPanda from '@pandacss/preset-panda'
import type { Preset } from '@pandacss/types'

import { recipes } from './recipes'
import { semanticTokens } from './semantic-tokens'
import { slotRecipes } from './slot-recipes'
import { mergeConfigs } from '@pandacss/config'

const textStyles = {
  headline: {
    DEFAULT: {
      value: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
      },
    },
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

export const fixturePreset = {
  name: '@pandacss/fixture-preset',
  presets: [presetBase, presetPanda],
  conditions: {
    extend: {
      materialTheme: '[data-color=material] &',
      pastelTheme: '[data-color=pastel] &',
      dark: '[data-theme=dark] &, .dark &, &.dark, &[data-theme=dark]',
      light: '[data-theme=light] &, .light &, &.light, &[data-theme=light]',
    },
  },
  theme: {
    extend: {
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
  },
} satisfies Preset

export const builtInPresets = {
  base: presetBase,
  panda: presetPanda,
}

export const fixtureMergedConfig = mergeConfigs([fixturePreset, ...fixturePreset.presets])
