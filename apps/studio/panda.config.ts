import { defineConfig } from '@pandacss/dev'
import { globalCss } from './theme/global-css'
import { button, control, navItem, tokenCell } from './theme/recipes'
import { frame, select, tabs } from './theme/slot-recipes'
import { semanticTokens, tokens } from './theme/tokens'

export default defineConfig({
  presets: ['@pandacss/preset-base', '@pandacss/preset-panda'],
  preflight: true,
  include: ['./components/**/*.{vue,ts}', './pages/**/*.{vue,ts}', './*.{vue,ts}'],
  exclude: ['**/node_modules/**'],
  outdir: 'styled-system',
  jsxFramework: 'vue',
  staticCss: {
    recipes: {
      tokenCell: ['*'],
      button: ['*'],
      control: ['*'],
      select: ['*'],
    },
  },
  conditions: {
    extend: {
      dark: '[data-theme="dark"] &',
      light: '[data-theme="light"] &',
    },
  },
  theme: {
    extend: {
      tokens,
      semanticTokens,
      recipes: { button, control, navItem, tokenCell },
      slotRecipes: { select, frame, tabs },
      keyframes: {
        livePulse: {
          '0%, 100%': { boxShadow: '0 0 0 2px var(--ring)' },
          '50%': { boxShadow: '0 0 0 5px var(--ring)' },
        },
      },
    },
  },
  globalCss,
})
