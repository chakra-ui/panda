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
      text: { value: { base: '{colors.gray.600}', dark: '{colors.gray.400}' } },
      bg: { value: { base: '#242424', osLight: '#ffffff' } },
    },
  },
  layerStyles: {
    'token-group': {
      value: {
        display: 'flex',
        flexDir: 'column',
        gap: '3',
        width: 'full',
        marginTop: '5',
      },
    },

    'token-content': {
      value: {
        display: 'flex',
        flexDir: 'column',
        gap: '5',
        lineHeight: '3.75',
      },
    },
  },
  jsxFramework: 'react',
})
