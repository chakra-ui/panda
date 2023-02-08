import { defineConfig } from 'css-panda'

export default defineConfig({
  preflight: true,
  include: ['./stories/**/*.jsx'],
  exclude: [],
  outdir: 'styled-system',
})
