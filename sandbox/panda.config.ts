import { config } from '@css-panda/fixture'
import { defineConfig } from 'css-panda'

export default defineConfig({
  ...config,
  clean: false,
  watch: false,
  hash: false,
  outdir: 'styled-system',
  include: ['*.jsx'],
})
