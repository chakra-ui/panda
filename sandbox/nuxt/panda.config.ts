import { defineConfig } from 'css-panda'

export default defineConfig({
  preflight: true,
  include: ['./pages/**/*.{vue,tsx}', './button.css.ts'],
  exclude: [],
  outdir: 'styled-system',
  jsxFramework: 'vue',
})
