import { defineConfig } from 'css-panda'

export default defineConfig({
  include: ['src/**/*.tsx'],
  outdir: 'panda',
  presets: ['css-panda/presets'],
  jsxFramework: 'solid',
})
