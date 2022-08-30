import { config } from '@css-panda/fixture'
import { defineConfig } from '@css-panda/types'

export default defineConfig({
  ...config,
  clean: true,
  // hash: true,
  outdir: '__generated__',
  cwd: process.cwd(),
  content: ['*.jsx'],
})
