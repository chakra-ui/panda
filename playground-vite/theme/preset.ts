import { definePreset } from '@pandacss/dev'
import recipes from './recipes'

export default definePreset({
  conditions: {
    extend: {
      dark: '.dark &, [data-theme="dark"] &',
      light: '.light &',
      closed: '&:is([data-state=closed])',
      open: '&:is([open], [data-state=open])',
      hidden: '&:is([hidden])',
      hover: '&:is(:hover, [data-hover]):not(:disabled)',
    },
  },
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
