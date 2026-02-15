import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  preflight: true,
  include: ['./src/**/*.{tsx,jsx}'],
  exclude: [],
  outdir: 'styled-system',
  jsxFramework: 'react',
  theme: {
    recipes: {
      button: {
        className: 'button',
        description: 'A button styles',
        base: {
          fontSize: 'lg',
        },
        variants: {
          size: {
            sm: { padding: '2', borderRadius: 'sm' },
            md: { padding: '4', borderRadius: 'md' },
          },
          variant: {
            primary: { color: 'white', backgroundColor: 'blue.500' },
            danger: { color: 'white', backgroundColor: 'red.500' },
          },
        },
      },
    },
  },
  globalCss: {
    '*': {
      fontFamily: 'Inter, sans-serif',
      margin: '0',
    },
  },
})
