import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  preflight: true,
  include: ['./pages/**/*.{vue,ts,tsx}', './components/**/*.{vue,ts,tsx}'],
  exclude: [],
  outdir: 'styled-system',
  jsxFramework: 'vue',
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
