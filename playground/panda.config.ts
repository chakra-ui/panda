import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  preflight: true,
  jsxFramework: 'react',
  include: ['./src/**/*.{tsx,jsx}', './pages/**/*.{jsx,tsx}'],
  exclude: [],
  outdir: 'design-system',
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
      },
    },
    '*, *::before, *::after': {
      borderColor: 'gray.300',
      borderStyle: 'solid',
    },
  },
})
