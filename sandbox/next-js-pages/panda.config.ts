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
  jsxFramework: 'react',
  theme: {
    extend: {
      slotRecipes: {
        custom: {
          slots: ['root', 'label'],
          className: 'custom',
          base: {
            root: {
              color: 'red',
              bg: 'red.300',
            },
            label: {
              fontWeight: 'medium',
            },
          },
          variants: {
            size: {
              sm: {
                root: {
                  padding: '10px',
                },
              },
              md: {
                root: {
                  padding: '20px',
                },
              },
            },
          },
          defaultVariants: {
            size: 'sm',
          },
        },
      },
    },
  },
})
