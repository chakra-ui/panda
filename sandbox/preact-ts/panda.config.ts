import { defineConfig, defineSlotRecipe } from '@pandacss/dev'

export default defineConfig({
  preflight: true,
  include: ['./src/**/*.{tsx,jsx}', './pages/**/*.{jsx,tsx}'],
  exclude: [],
  outdir: 'styled-system',
  jsxFramework: 'preact',
  theme: {
    extend: {
      recipes: {
        card: defineSlotRecipe({
          className: 'card',
          slots: ['label', 'icon'],
          base: {
            label: {
              color: 'red',
              textDecoration: 'underline',
            },
          },
          variants: {
            rounded: {
              true: {},
            },
            size: {
              sm: {
                label: {
                  fontSize: 'sm',
                },
                icon: {
                  fontSize: 'sm',
                },
              },
              lg: {
                label: {
                  fontSize: 'lg',
                },
                icon: {
                  fontSize: 'lg',
                  color: 'pink',
                },
              },
            },
          },
          defaultVariants: {
            size: 'sm',
          },
          compoundVariants: [
            {
              size: 'lg',
              rounded: true,
              css: {
                label: {
                  textTransform: 'uppercase',
                },
              },
            },
          ],
        }),
      },
    },
  },
})
