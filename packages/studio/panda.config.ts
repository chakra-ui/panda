import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  gitignore: false,
  preflight: true,
  include: ['./src/**/*.{tsx,jsx,astro}'],
  exclude: [],
  outdir: 'styled-system',
  jsxFactory: 'panda',
  jsxFramework: 'react',
  theme: {
    extend: {
      semanticTokens: {
        colors: {
          text: { value: { base: '{colors.slate.200}', _osLight: '{colors.black}' } },
          bg: { value: { base: '{colors.slate.900}', _osLight: '{colors.white}' } },
          card: { value: { base: '{colors.slate.800}', _osLight: '{colors.slate.200}' } },
        },
      },
    },
  },
  patterns: {
    extend: {
      styledLink: {
        properties: {},
        transform: (props: any) => ({
          display: 'inline-flex',
          alignItems: 'center',
          opacity: '0.5',
          borderBottom: '1px solid transparent',
          cursor: 'pointer',
          _hover: { opacity: 1, borderBottomColor: 'black' },
          ...props,
        }),
      },
    },
  },
  utilities: {
    extend: {
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
  },
  staticCss: {
    css: [
      {
        properties: {
          color: ['red.400'],
        },
      },
    ],
  },
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
})
