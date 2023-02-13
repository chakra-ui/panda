import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  presets: ['@pandacss/dev/presets'],
  outdir: 'styled-system',
  include: ['pages/**/*.jsx'],
  jsxFramework: 'react',
})
