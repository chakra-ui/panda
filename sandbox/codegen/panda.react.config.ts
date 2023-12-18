import { defineConfig } from '@pandacss/dev'
import codegenPreset from './preset'

export default defineConfig({
  presets: ['@pandacss/dev/presets', codegenPreset],
  // Whether to use css reset
  preflight: true,

  // Where to look for your css declarations
  include: ['./src/**/*.{js,jsx,ts,tsx}', './pages/**/*.{js,jsx,ts,tsx}'],

  // Files to exclude
  exclude: [],

  // The output directory for your css system
  outdir: 'styled-system',

  // The JSX framework to use
  jsxFramework: 'react',

  // Stitches preset
  formatTokenName: (path) => `$${path.join('-')}`,
  formatClassName: (token) => token.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
  formatCssVar: 'dash',
})
