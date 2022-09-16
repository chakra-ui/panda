import { config } from '@css-panda/fixture'
import { defineConfig } from 'css-panda'

export default defineConfig({
  ...config,
  clean: true,
  outdir: 'styled-system',
  include: ['src/**/*.jsx'],
})
