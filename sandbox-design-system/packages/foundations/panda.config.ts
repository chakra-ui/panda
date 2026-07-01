import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  presets: ['@pandacss/preset-base'],
  include: ['src/**/*.tsx'],
  outdir: 'styled-system',
  theme: {
    tokens: {
      colors: {
        foundation: { value: '#0f766e' },
      },
      spacing: {
        foundationGap: { value: '10px' },
      },
    },
  },
})
