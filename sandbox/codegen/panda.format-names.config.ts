import { defineConfig } from '@pandacss/dev'
import codegenPreset from './preset'

const dasherize = (token) =>
  token
    .toString()
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export default defineConfig({
  presets: ['@pandacss/dev/presets', codegenPreset],
  // Whether to use css reset
  preflight: true,

  // Where to look for your css declarations
  include: ['./src/**/*.{js,jsx,ts,tsx}', './pages/**/*.{js,jsx,ts,tsx}'],

  // Files to exclude
  exclude: [],

  // The output directory for your css system
  outdir: 'styled-system-format-names',

  // The JSX framework to use
  jsxFramework: 'react',

  // Stitches preset
  separator: '-',
  hooks: {
    'tokens:created': ({ configure }) => {
      configure({
        formatTokenName: (path) => `$${path.join('-')}`,
        formatCssVar: (path) => {
          const variable = dasherize(path.join('-'))
          return {
            var: variable,
            ref: `var(--${variable})`,
          }
        },
      })
    },
  },
})
