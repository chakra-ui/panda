import { config } from '@css-panda/fixture'
import { defineConfig } from 'css-panda'

export default defineConfig({
  ...config,
  outdir: 'styled-system',
  include: ['src/**/*.jsx'],
})
