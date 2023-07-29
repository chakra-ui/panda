import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  outExtension: 'js',
  studio: {
    logo: 'https://place-hold.it/36x24',
  },
  preflight: true,
  include: ['./app/routes/**/*.{tsx,jsx}', './app/components/**/*.{tsx,jsx}'],
  exclude: [],
  outdir: 'styled-system',
  theme: {
    semanticTokens: {
      colors: {
        text: { value: { base: '{colors.gray.600}', _osDark: '{colors.gray.400}' } },
      },
    },
    recipes: {
      button: {
        className: 'button',
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
