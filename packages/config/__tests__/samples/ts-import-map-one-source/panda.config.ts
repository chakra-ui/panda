import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  preflight: false,
  presets: ['@pandacss/dev/presets'],
  include: ['./ts-import-map.js'],
  exclude: [],
  hash: false,
  outdir: './outdir',
  importMap: {
    css: '@my-panda-styled-system',
    recipes: '@my-panda-styled-system',
    patterns: '@my-panda-styled-system',
    jsx: '@my-panda-styled-system',
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
        card: {
          className: 'card',
          base: { h: '10', px: '4' },
        },
      },
    },
  },
})
