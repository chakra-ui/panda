import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  presets: ['@pandacss/preset-base'],
  include: ['src/**/*.tsx'],
  outdir: 'styled-system',
  jsxFramework: 'react',
  theme: {
    tokens: {
      colors: {
        foundation: { value: '#0f766e' },
        // Nested token — consumers should see `bg.neutral` in local outdir types after full re-emit.
        bg: {
          neutral: { value: '#f0fdfa' },
        },
      },
      spacing: {
        foundationGap: { value: '10px' },
      },
    },
  },
})
