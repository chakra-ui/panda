import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  preflight: true,
  include: ['src/**/*.tsx'],
  jsxFramework: 'solid',
  theme: {
    extend: {
      tokens: {
        colors: {
          black: { value: 'black' },
          white: { value: 'white' },
        },
      },
      semanticTokens: {
        colors: {
          fg: {
            default: {
              value: { base: '{colors.black/87}', _dark: '{colors.white}' },
            },
          },
        },
      },
    },

    slotRecipes: {
      custom: {
        slots: ['root', 'label'],
        className: 'custom',
        base: {
          root: {
            color: 'red',
            bg: 'red.300',
          },
          label: {
            fontWeight: 'medium',
          },
        },
        variants: {
          size: {
            sm: {
              root: {
                padding: '10px',
              },
            },
            md: {
              root: {
                padding: '20px',
              },
            },
          },
        },
        defaultVariants: {
          size: 'sm',
        },
      },
    },
  },
  // strictTokens: true,
  globalVars: {
    extend: {
      '--some-color': 'red',
      '--button-color': {
        syntax: '<color>',
        inherits: false,
        initialValue: 'blue',
      },
    },
  },
})
