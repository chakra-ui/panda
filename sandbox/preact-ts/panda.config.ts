import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  preflight: true,
  include: ['./src/**/*.{tsx,jsx}', './pages/**/*.{jsx,tsx}'],
  exclude: [],
  outdir: 'styled-system',
  jsxFramework: 'preact',
  patterns: {
    extend: {
      stack: {
        defaultValues: {
          gap: '0',
        },
      },
    },
  },
  theme: {
    extend: {
      tokens: {
        colors: {
          aaa: { value: 'azaz23' },
        },
      },
      recipes: {
        btn: {
          base: {
            color: 'blue.500',
          },
        },
      },

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
  importMap: ['styled-system', '#styles'],
})
