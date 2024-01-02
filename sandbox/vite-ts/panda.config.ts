import { defineConfig, defineRecipe } from '@pandacss/dev'

const someRecipe = defineRecipe({
  className: 'some-recipe',
  base: { color: 'green', fontSize: '16px' },
  variants: {
    size: { small: { fontSize: '14px' } },
  },
  compoundVariants: [{ size: 'small', css: { color: 'blue' } }],
})

export default defineConfig({
  preflight: true,
  strictTokens: true,
  include: ['./src/**/*.{tsx,jsx}', './pages/**/*.{jsx,tsx}'],
  exclude: [],
  outdir: 'styled-system',
  jsxFactory: 'panda',
  jsxFramework: 'react',
  theme: {
    semanticTokens: {
      colors: {
        text: { value: { base: '{colors.gray.600}', _osDark: '{colors.gray.400}' } },
      },
    },
    recipes: {
      someRecipe,
      button: {
        className: 'button',
        jsx: ['Button', 'ListedButton', /WithRegex$/, 'PrimaryButtonLike'],
        description: 'A button styles',
        base: {
          fontSize: 'lg',
        },
        variants: {
          size: {
            sm: {
              padding: '2',
              borderRadius: 'sm',
            },
            md: {
              padding: '4',
              borderRadius: 'md',
            },
          },
          variant: {
            primary: {
              color: 'white',
              backgroundColor: 'blue.500',
            },
            danger: {
              color: 'white',
              backgroundColor: 'red.500',
            },
            secondary: {
              color: 'pink.300',
              backgroundColor: 'green.500',
            },
            purple: {
              color: 'amber.300',
              backgroundColor: 'purple.500',
            },
          },
          state: {
            focused: {
              color: 'green',
            },
            hovered: {
              color: 'pink.400',
            },
          },
          rounded: {
            true: {
              borderRadius: 'md',
            },
          },
        },
        compoundVariants: [
          {
            size: 'sm',
            variant: 'primary',
            css: {
              fontSize: '12px',
            },
          },
          {
            variant: ['primary', 'danger'],
            state: 'focused',
            css: {
              padding: 4,
              fontWeight: 'bold',
              fontSize: '24px',
            },
          },
        ],
      },
    },
  },
  globalCss: {
    '*': {
      fontFamily: 'Inter',
      margin: '0',
    },
    a: {
      color: 'inherit',
      textDecoration: 'none',
    },
  },
})
