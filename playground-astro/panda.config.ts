import { defineConfig } from '@pandacss/dev'
import playgroundPreset from './theme/preset'

export default defineConfig({
  presets: ['@pandacss/dev/presets', playgroundPreset],
  // Whether to use css reset
  preflight: true,

  // Where to look for your css declarations
  include: ['./src/**/*.{js,jsx,ts,tsx}', './pages/**/*.{js,jsx,ts,tsx}'],

  // Files to exclude
  exclude: [],

  // The output directory for your css system
  outdir: 'styled-system',
  jsxFramework: 'react',
})
