import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  preflight: false,
  presets: ['@pandacss/dev/presets'],
  include: ['./ts-import-map.js'],
  exclude: [],
  hash: false,
  jsxFramework: 'react',
  outdir: './ts-import-map-outdir',
  importMap: {
    css: '#panda/css',
    recipes: '#panda/recipes',
    patterns: '#panda/patterns',
    jsx: '#panda/jsx',
  },
  theme: {
    extend: {
      recipes: {
        button: {
          className: 'button',
          description: 'The styles for the Button component',
          base: {
            borderRadius: 'md',
            fontWeight: 'semibold',
            h: '10',
            px: '4',
          },
          variants: {
            visual: {
              solid: {
                bg: { base: 'colorPalette.500', _dark: 'colorPalette.300' },
                color: { base: 'white', _dark: 'gray.800' },
              },
              outline: {
                border: '1px solid',
                color: { base: 'colorPalette.600', _dark: 'colorPalette.200' },
                borderColor: 'currentColor',
              },
            },
          },
        },
      },
    },
  },
})
