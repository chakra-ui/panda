import { defineConfig } from 'css-panda'

export default defineConfig({
  preflight: true,
  presets: ['css-panda/presets'],
  include: ['./src/**/*.{tsx,jsx}', './pages/**/*.{jsx,tsx}'],
  exclude: [],
  outdir: 'design-system',
  semanticTokens: {
    colors: {
      text: { value: { base: '{colors.gray.600}', osDark: '{colors.gray.400}' } },
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
