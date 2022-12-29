import { defineConfig } from 'css-panda'

export default defineConfig({
  presets: ['css-panda/presets'],
  outdir: 'styled-system',
  include: ['pages/**/*.jsx'],
  jsxFramework: 'react',
})
