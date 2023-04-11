import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  studio: {
    title: 'Chakra UI',
    logo: 'https://place-hold.it/36x24',
  },
  preflight: true,
  include: ['./src/**/*.{tsx,jsx}', './pages/**/*.{jsx,tsx}'],
  exclude: [],
  outdir: 'design-system',
  theme: {
    semanticTokens: {
      colors: {
        text: { value: { base: '{colors.gray.600}', _osDark: '{colors.gray.400}' } },
      },
    },
    recipes: {
      button: {
        name: 'button',
        jsx: ['Button', 'ListedButton', /WithRegex$/],
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
          },
        },
      },
    },
  },
  jsxFramework: 'react',
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
