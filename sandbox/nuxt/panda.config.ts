import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  presets: ['@pandacss/preset-base', '@pandacss/preset-panda'],
  preflight: true,
  include: ['./pages/**/*.{vue,ts,tsx}', './components/**/*.{vue,ts,tsx}'],
  exclude: [],
  outdir: 'styled-system',
  jsxFramework: 'vue',
  jsxStyleProps: 'all',
})
