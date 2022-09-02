import { config } from '@css-panda/fixture'
import { defineConfig } from '@css-panda/types'

export default defineConfig({
  ...config,
  clean: false,
  watch: false,
  hash: false,
  outdir: '__generated__',
  include: ['*.jsx'],
})
