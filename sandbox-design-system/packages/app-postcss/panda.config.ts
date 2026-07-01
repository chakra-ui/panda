import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  designSystem: '@sandbox/ds',
  include: ['src/**/*.tsx'],
  outdir: 'styled-system',
  theme: {
    extend: {
      tokens: {
        colors: {
          brand: { value: '#facc15' },
        },
        spacing: {
          4: { value: '1rem' },
          6: { value: '1.5rem' },
        },
      },
    },
  },
})
