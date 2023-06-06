import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  include: ['src/**/*.tsx'],
  outdir: 'panda',
  jsxFramework: 'solid',
  jsxFactory: 'panda',
})
