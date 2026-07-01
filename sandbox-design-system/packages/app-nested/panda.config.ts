import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  designSystem: '@sandbox/ds-nested',
  include: ['src/**/*.tsx'],
  outdir: 'styled-system',
  theme: {
    extend: {
      tokens: {
        colors: {
          brand: { value: '#e11d48' },
        },
        spacing: {
          2: { value: '0.5rem' },
        },
      },
    },
  },
})
