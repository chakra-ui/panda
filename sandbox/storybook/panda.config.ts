import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  preflight: true,
  include: ['./stories/**/*.jsx'],
  exclude: [],
  outdir: 'styled-system',
})
