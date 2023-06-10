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
      tokens: {
        colors: {
          neutral: {
            50: { value: '#fafafa' },
            100: { value: '#f5f5f5' },
            200: { value: '#e5e5e5' },
            300: { value: '#d4d4d4' },
            400: { value: '#a3a3a3' },
            500: { value: '#737373' },
            600: { value: '#525252' },
            700: { value: '#404040' },
            800: { value: '#262626' },
            900: { value: '#171717' },
            950: { value: '#0a0a0a' },
          },
        },
        assets: {
          check: {
            value: {
              type: 'url',
              value:
                'data:image/svg+xml;utf8,%3Csvg%20width%3D%226%22%20height%3D%226%22%20viewBox%3D%220%200%206%206%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M0%200H3V3H0V0Z%22%20fill%3D%22%23E1E1E1%22/%3E%3Cpath%20d%3D%22M3%200H6V3H3V0Z%22%20fill%3D%22white%22/%3E%3Cpath%20d%3D%22M3%203H6V6H3V3Z%22%20fill%3D%22%23E1E1E1%22/%3E%3Cpath%20d%3D%22M0%203H3V6H0V3Z%22%20fill%3D%22white%22/%3E%3C/svg%3E%0A',
            },
          },
        },
      },
      semanticTokens: {
        colors: {
          text: { value: { base: '{colors.neutral.200}', _light: '{colors.black}' } },
          bg: { value: { base: '{colors.neutral.900}', _light: '{colors.white}' } },
          card: { value: { base: '{colors.neutral.800}', _light: '{colors.neutral.200}' } },
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
