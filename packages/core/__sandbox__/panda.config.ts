import { config } from '@css-panda/fixture'
import { defineConfig } from '@css-panda/types'

export default defineConfig({
  ...config,
  clean: true,
  outdir: '__generated__',
  content: ['*.jsx'],
})
