import { defineConfig } from '../src/index'
import { config } from '../src/presets'

export default defineConfig({
  preflight: true,
  ...config,
  // presets: ['../src/presets'],
  include: ['./src/**/*.{tsx,jsx}'],
  exclude: [],
  outdir: 'design-system',
  semanticTokens: {
    colors: {
      text: { value: { base: '{colors.gray.600}', dark: '{colors.green.400}' } },
      bg: { value: { base: '#242424', osLight: '#ffffff' } },
    },
  },
  layerStyles: {
    'token-group': {
      value: {
        display: 'flex',
        flexDir: 'column',
        gap: '12px',
        width: 'full',
        marginTop: '20px',
      },
    },

    'token-content': {
      value: {
        display: 'flex',
        flexDir: 'column',
        gap: '20px',
        lineHeight: '15px',
      },
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
