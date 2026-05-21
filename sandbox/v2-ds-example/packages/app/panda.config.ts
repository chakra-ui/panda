import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  preflight: true,
  designSystem: '@v2-ds-example/lib',
  include: [
    './src/**/*.{ts,tsx}',
    '@v2-ds-example/charts', // smart-include: NO manifest — auto-globbed via package.json files array
  ],
  exclude: [],
  outdir: './styled-system',
  theme: {
    extend: {
      tokens: {
        colors: {
          brand: { value: '#ec4899' }, // consumer override — wins over lib's #3b82f6
          brand2: { value: '#8b5cf6' },
        },
      },
    },
  },
})
