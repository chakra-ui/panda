import { defineConfig } from '@pandacss/dev'
import typographyPreset from '@pandacss/preset-typography'

export default defineConfig({
  preflight: true,
  include: ['./src/**/*.{ts,tsx}'],
  exclude: [],
  outdir: 'styled-system',
  jsxFramework: 'react',
  presets: [
    '@pandacss/preset-base',
    '@pandacss/preset-panda',
    typographyPreset({
      notProse: true,
    }),
  ],
  staticCss: {
    recipes: {
      prose: [{ size: ['sm', 'md', 'lg', 'xl', '2xl'] }],
    },
  },
  globalCss: {
    body: {
      bg: 'white',
      color: 'neutral.900',
      minHeight: '100dvh',
      fontFamily: 'sans',
      _dark: {
        bg: 'neutral.950',
        color: 'neutral.100',
      },
    },
  },
})
