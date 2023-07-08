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
    },
    recipes: {
      splitter: {
        name: 'splitter',
        description: 'The styles for the splitter component',
        base: {
          flex: '1',

          '& [data-part="panel"]': {
            display: 'flex',
            alignItems: 'stretch',
          },

          '& [data-part="resize-trigger"]': {
            background: 'border.default',
            position: 'relative',

            opacity: { _before: 0, _hover: { _before: 1 } },

            _before: {
              content: "''",
              transition: ' opacity .4s',
              bg: '#7d7d7d1a',
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 1,
            },

            _vertical: {
              minHeight: '1px',
              _before: { top: '-6px', bottom: '-6px', w: 'full' },
            },

            _horizontal: {
              minWidth: '1px',
              _before: { right: '-10px', h: 'full' },
            },

            '&[hidden]': {
              display: 'none',
            },
          },
        },
      },
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
      borderColor: 'gray.300',
      borderStyle: 'solid',
    },
  },
})
