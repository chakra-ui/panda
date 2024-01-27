import { defineConfig } from '@pandacss/dev'
import { removeUnusedCssVars } from './remove-unused-css-vars'
import { removeUnusedKeyframes } from './remove-unused-keyframes'

export default defineConfig({
  hooks: {
    // Dynamically add a recipe
    'config:resolved': async ({ conf }) => {
      const { someRecipe } = await import('./some-recipe')
      const recipes = conf.config.theme?.recipes
      if (recipes) {
        recipes['someRecipe'] = someRecipe
      }
    },
    // Dynamically create a CSS rule
    'context:created': ({ ctx }) => {
      ctx.processor.css({ color: 'lime.300' })
    },
    // Remove unused CSS vars
    'cssgen:done': ({ artifact, content }) => {
      if (artifact === 'styles.css') {
        return removeUnusedCssVars(removeUnusedKeyframes(content))
      }
    },
  },
  preflight: true,
  include: ['./src/**/*.{tsx,jsx}', './pages/**/*.{jsx,tsx}'],
  exclude: [],
  outdir: 'styled-system',
  jsxFactory: 'panda',
  jsxFramework: 'react',
  conditions: {},
  validation: 'warn',
  theme: {
    // tokens: {},
    semanticTokens: {
      colors: {
        text: { value: { base: '{colors.gray.600}', _osDark: '{colors.gray.400}' } },
        // text: { value: { base: '{colors.aagray.600}', _osDark: '{colors.gray.400}', _osLight: '{colors.aaa}' } },
        // middle: { value: { base: '{colors.text}', _osDark: '{colors.gray.500}' } },
        // end: { value: { base: '{colors.aaa}', _osDark: '{colors.middle}' } },
      },
    },
    recipes: {
      // someRecipe,
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
