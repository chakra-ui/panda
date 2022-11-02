import { defineConfig } from 'css-panda'

export default defineConfig({
  preflight: true,
  include: ['./src/**/*.{astro,tsx}'],
  presets: ['css-panda/presets'],
  outdir: 'panda',
})
