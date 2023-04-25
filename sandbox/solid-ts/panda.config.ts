import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  include: ['src/**/*.tsx'],
  outdir: 'styled-system',
  presets: ['@pandacss/dev/presets'],
  jsxFramework: 'solid',
})
