import { defineConfig } from '@pandacss/dev'
import { buttonRecipe } from './theme/button.recipe'
import { iconRecipe } from './theme/icon.recipe'
import { wrapValue } from './theme/wrap-value'

export default defineConfig({
  // Whether to use css reset
  preflight: true,

  // Where to look for your css declarations
  include: ['./src/**/*.{js,jsx,ts,tsx}', './pages/**/*.{js,jsx,ts,tsx}'],

  // Files to exclude
  exclude: [],

  conditions: {
    extend: {
      dark: '.dark &, [data-theme="dark"] &',
      light: '.light &',
    },
  },
  // Useful for theme customization
  theme: {
    extend: {
      tokens: {
        colors: wrapValue({
          whiteAlpha: {
            50: 'rgba(255, 255, 255, 0.04)',
            100: 'rgba(255, 255, 255, 0.06)',
            200: 'rgba(255, 255, 255, 0.08)',
            300: 'rgba(255, 255, 255, 0.16)',
            400: 'rgba(255, 255, 255, 0.24)',
            500: 'rgba(255, 255, 255, 0.36)',
            600: 'rgba(255, 255, 255, 0.48)',
            700: 'rgba(255, 255, 255, 0.64)',
            800: 'rgba(255, 255, 255, 0.80)',
            900: 'rgba(255, 255, 255, 0.92)',
          },
        }),
      },
      recipes: {
        button: buttonRecipe,
        icon: iconRecipe,
      },
    },
  },

  // The output directory for your css system
  outdir: 'styled-system',
  jsxFramework: 'react',
})
