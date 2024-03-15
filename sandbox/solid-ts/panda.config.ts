import { defineConfig } from '@pandacss/dev'

export default defineConfig({
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
