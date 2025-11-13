import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  preflight: true,
  include: ['./stories/**/*.{jsx,tsx}'],
  exclude: [],
  outdir: 'styled-system',
})
