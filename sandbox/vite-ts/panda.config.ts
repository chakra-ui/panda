import { someRecipe } from './some-recipe'

export default {
  presets: ['@pandacss/preset-base', '@pandacss/preset-panda'],
  codegenFormat: 'js',
  preflight: true,
  // v1 sandbox used a `cssgen:done` hook to strip unused vars/keyframes and a
  // `context:created` hook to inject the lime.300 rule — both native in v2.
  optimize: {
    removeUnusedTokens: true,
    removeUnusedKeyframes: true,
  },
  staticCss: {
    css: [{ properties: { color: ['lime.300'] } }],
  },
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
}
