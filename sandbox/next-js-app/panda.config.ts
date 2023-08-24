import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // Whether to use css reset
  preflight: true,

  // Where to look for your css declarations
  include: ['./src/**/*.{js,jsx,ts,tsx}', './pages/**/*.{js,jsx,ts,tsx}'],

  // Files to exclude
  exclude: [],

  // The output directory for your css system
  outdir: 'styled-system',
  theme: {
    extend: {
      recipes: {
        thingy: {
          jsx: ['Thingy'],
          className: 'thingy',
          base: { display: 'flex', fontSize: 'lg' },
          variants: {
            variant: {
              primary: { color: 'white', backgroundColor: 'blue.500' },
              danger: { color: 'white', backgroundColor: 'red.500' },
              secondary: { color: 'pink.300', backgroundColor: 'green.500' },
            },
          },
        },
      },
    },
  },
})
