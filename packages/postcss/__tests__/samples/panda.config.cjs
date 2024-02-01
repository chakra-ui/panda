const { defineConfig } = require('@pandacss/dev')

module.exports = defineConfig({
  preflight: true,
  presets: ['@pandacss/dev/presets'],
  include: ['./src/**/*.{ts,tsx,jsx}', './src/**/*.{css,pcss}'],
  exclude: [],
  jsxFramework: 'react',
})
