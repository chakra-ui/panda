import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  include: ['src/**/*.tsx'],
  outdir: 'panda',
  presets: ['@pandacss/dev/presets'],
  jsxFramework: 'solid',
})
