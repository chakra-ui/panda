import { recipes } from '@/theme/recipes'
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  preflight: true,
  jsxFramework: 'react',
  include: ['./src/**/*.{tsx,jsx}', './pages/**/*.{jsx,tsx}'],
  exclude: [],
  outdir: 'styled-system',
  jsxFactory: 'panda',
  theme: {
    extend: {
      tokens: {
        colors: {
          primary: { value: '#F6E458' },
        },
      },
      semanticTokens: {
        colors: {
          border: {
            default: {
              value: {
                base: '#EBEBEB',
                _dark: '#FFFFFF0D',
              },
            },

            badge: {
              value: {
                base: '#EBEBEB',
                _dark: '#FFFFFF4D',
              },
            },
          },
          text: {
            default: {
              value: {
                base: '#778597',
                _dark: '#FFFFFF4D',
              },
            },
          },
        },
      },
      recipes,
    },
  },

  globalCss: {
    html: {
      lineHeight: 1.5,
      textRendering: 'optimizeLegibility',
      MozOsxFontSmoothing: 'grayscale',
      WebkitFontSmoothing: 'antialiased',
      WebkitTextSizeAdjust: '100%',
      height: '100%',
    },
    body: {
      fontFamily: 'var(--font-inter), sans-serif',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 'full',
      height: 'fit-content',
      maxHeight: '100%',
      _dark: {
        colorScheme: 'dark',
        bg: '#282828',
      },
    },
    '*, *::before, *::after': {
      borderColor: 'border.default',
      borderStyle: 'solid',
    },
  },
})
