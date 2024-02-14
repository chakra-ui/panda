import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  preflight: true,
  include: ['./src/**/*.{js,jsx,ts,tsx}', './pages/**/*.{js,jsx,ts,tsx}'],
  exclude: [],
  theme: {
    extend: {},
  },
  outdir: 'styled-system',
  outExtension: 'js',
  forceConsistentTypeExtension: true,
})
