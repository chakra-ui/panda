import { defineConfig } from '@pandacss/dev'
import { themeTokens } from '@/theme/tokens'

export default defineConfig({
  preflight: true,
  presets: ['@pandacss/dev/presets'],
  include: ['./src/**/*.{ts,tsx,jsx}'],
  exclude: [],
  hash: false,
  jsxFramework: 'react',
  theme: {
    extend: {
      tokens: themeTokens,
    },
  },
})
