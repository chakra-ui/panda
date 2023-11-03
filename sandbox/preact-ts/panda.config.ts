import { defineConfig, defineSlotRecipe } from '@pandacss/dev'
import { aaa } from './recipes/aaa'
import { bbb } from './recipes/bbb'
import { ccc } from './recipes/ccc'
import { dddFff } from './recipes/ddd-fff'

const recipes = {
  aaa,
  bbb,
  ccc,
  dddFff,
}
export default defineConfig({
  preflight: true,
  include: ['./src/**/*.{tsx,jsx}', './pages/**/*.{jsx,tsx}'],
  exclude: [],
  outdir: 'styled-system',
  jsxFramework: 'preact',
  patterns: {
    extend: {
      aspectRatio: {
        description: '555',
      },
    },
  },
  theme: {
    extend: {
      recipes,
      slotRecipes: {
        card: defineSlotRecipe({
          className: 'u-card123',
          slots: ['root', 'label', 'icon'],
          base: {
            root: {
              bg: 'red.200',
            },
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
  utilities: {
    extend: {
      backgroundColor: {
        className: '123',
        transform: (value) => {
          return `ssf-${value}`
        },
      },
      color: {
        className: '123',
        transform: (value) => {
          return `ssf-${value}`
        },
      },
    },
  },
})
