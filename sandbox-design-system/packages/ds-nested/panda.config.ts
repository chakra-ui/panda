import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  designSystem: '@sandbox/foundations',
  include: ['src/**/*.tsx'],
  outdir: 'styled-system',
  theme: {
    tokens: {
      colors: {
        brand: { value: '#2563eb' },
      },
      radii: {
        md: { value: '0.375rem' },
      },
    },
  },
})
