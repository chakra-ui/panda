import { config } from '@css-panda/fixture'
// import { defineConfig } from 'css-panda'

export default {
  ...(config as any),
  clean: false,
  watch: false,
  hash: false,
  outdir: 'styled-system',
  include: ['*.jsx'],
}
