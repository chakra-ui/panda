import { defineConfig } from 'css-panda'
import { utilities, breakpoints, conditions, keyframes, tokens, patterns } from 'css-panda/presets'

export default defineConfig({
  // whether to use css reset
  preflight: true,
  // where to look for your css declarations
  include: ['./src/**/*.{tsx,jsx}', './pages/**/*.{jsx,tsx}'],
  // files to exclude
  exclude: [],
  // The output directory for system
  outdir: 'design-system',
  // Add your css conditions here (&:hover, &:focus, etc)
  conditions,
  // Add your tokens here
  tokens,
  // Add your semantic tokens here
  semanticTokens: {
    colors: {
      text: { value: { base: 'gray.600', dark: 'gray.400' } },
    },
  },
  // Add your keyframes here (spin, fade, etc)
  keyframes,
  // Add your breakpoints here (sm, md, lg, xl)
  breakpoints,
  // Add your css property utilities here (mt, ml, etc)
  utilities,
  // Add your css patterns here (stack, grid, etc)
  patterns,
})
