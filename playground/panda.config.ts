import { recipes } from '@/theme/recipes'
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  preflight: true,
  jsxFramework: 'react',
  conditions: {
    closed: '&:is([data-state=closed])',
    open: '&:is([open], [data-state=open])',
    hidden: '&:is([hidden])',
  },
  include: ['./src/**/*.{tsx,jsx,ts}', './pages/**/*.{jsx,tsx,ts}'],
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
            complementary: {
              value: {
                base: '{colors.black}',
                _dark: '{colors.white}',
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
