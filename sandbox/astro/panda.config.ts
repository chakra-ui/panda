import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  preflight: true,
  include: ['./src/**/*.{astro,tsx}'],
  outdir: 'panda',
})
