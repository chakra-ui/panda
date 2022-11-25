import { defineConfig } from '../src/index'
import { config } from '../src/presets'

export default defineConfig({
  preflight: true,
  ...config,
  include: ['./src/**/*.{tsx,jsx}'],
  exclude: [],
  outdir: 'design-system',
  semanticTokens: {
    colors: {
      text: { value: { base: 'gray.600', dark: 'gray.400' } },
    },
  },
  jsxFramework: 'react',
  recipes: {
    button: {
      name: 'button',
      description: 'A button styles',
      base: {
        fontSize: 'lg',
      },
      variants: {
        variant: {
          primary: {
            color: 'white',
            backgroundColor: 'blue.500',
          },
        },
      },
    },
  },
})
