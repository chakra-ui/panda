import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  presets: ['@pandacss/preset-base'],
  include: ['src/**/*.{ts,tsx}'],
  outdir: 'styled-system',
  theme: {
    tokens: {
      colors: {
        brand: { value: '#facc15' },
      },
      radii: {
        md: { value: '0.375rem' },
      },
      spacing: {
        2: { value: '0.5rem' },
        3: { value: '0.75rem' },
      },
    },
    recipes: {
      tag: {
        className: 'tag',
        base: {
          display: 'inline-flex',
          alignItems: 'center',
          borderRadius: 'md',
          paddingInline: '2',
          fontSize: '14px',
          color: 'white',
          backgroundColor: 'black',
        },
      },
      chip: {
        className: 'chip',
        base: {
          display: 'inline-flex',
          alignItems: 'center',
          borderRadius: 'md',
          paddingInline: '2',
          color: 'white',
          backgroundColor: 'black',
        },
      },
    },
  },
})
