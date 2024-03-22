import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  preflight: true,
  include: ['./src/**/*.{js,jsx,ts,tsx}', './pages/**/*.{js,jsx,ts,tsx}'],
  exclude: [],
  theme: {
    extend: {},
  },
  themes: {
    primary: {
      tokens: {
        colors: {
          text: { value: 'red' },
        },
      },
      semanticTokens: {
        colors: {
          muted: { value: '{colors.red.200}' },
          body: {
            value: {
              base: '{colors.red.600}',
              _osDark: '{colors.red.400}',
            },
          },
        },
      },
    },
    secondary: {
      tokens: {
        colors: {
          text: { value: 'blue' },
        },
      },
      semanticTokens: {
        colors: {
          muted: { value: '{colors.blue.200}' },
          body: {
            value: {
              base: '{colors.blue.600}',
              _osDark: '{colors.blue.400}',
            },
          },
        },
      },
    },
  },
  outdir: 'styled-system',
  outExtension: 'js',
  forceConsistentTypeExtension: true,
})
