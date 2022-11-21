import { config } from '@pandacss/fixture'
import { defineConfig } from 'css-panda'

export default defineConfig({
  ...config,
  outdir: 'styled-system',
  include: ['pages/**/*.jsx'],
})
