import type { PatternConfig } from '@pandacss/types'
import config from '../src/presets'

export default {
  gitignore: false,
  preflight: true,
  presets: [],
  ...config,
  include: ['./src/**/*.{tsx,jsx,astro}'],
  exclude: [],
  outdir: 'design-system',
  theme: {
    ...config.theme,
    semanticTokens: {
      colors: {
        text: { value: { base: '{colors.slate.200}', _osLight: '{colors.black}' } },
        bg: { value: { base: '{colors.slate.900}', _osLight: '{colors.white}' } },
        card: { value: { base: '{colors.slate.800}', _osLight: '{colors.slate.200}' } },
      },
    },
  },
  patterns: {
    ...config.patterns,
    styledLink: {
      properties: {},
      transform: (props) => ({
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: 'sm',
        opacity: '0.5',
        borderBottom: '1px solid transparent',
        cursor: 'pointer',
        _hover: { opacity: 1, borderBottomColor: 'black' },
        ...props,
      }),
    } as PatternConfig,
  },
  utilities: {
    ...config.utilities,
    borderSlim: {
      className: 'border-slim',
      values: 'colors',
      transform(value: any) {
        return {
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: value,
        }
      },
    },
  },
  jsxFramework: 'react',

  globalCss: {
    ':root': {
      fontFamily: 'Inter, Avenir, Helvetica, Arial, sans-serif',
      fontSize: 'md',
      lineHeight: 'normal',
      fontWeight: 'normal',

      colorScheme: 'light dark',
      color: 'text',
      background: 'bg',

      fontSynthesis: 'none',
      textRendering: 'optimizeLegibility',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
      WebkitTextSizeAdjust: '100%',
    },

    a: {
      color: 'unset',
      textDecoration: 'none',
    },

    body: {
      margin: 0,
      minHeight: '100vh',
    },
  },
}
