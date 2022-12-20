import { defineConfig } from 'css-panda'

export default defineConfig({
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
    'html, body': {
      margin: '0',
      padding: '0',
      fontFamily: 'sans',
    },
    a: {
      color: 'inherit',
      textDecoration: 'none',
    },
  },
})
