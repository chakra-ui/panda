import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  outdir: 'styled-system',
  theme: {
    tokens: {
      colors: { red: { 500: { value: '#f00' } } },
    },
  },
  utilities: {
    color: { className: 'c', values: 'colors' },
  },
  conditions: { hover: '&:hover' },
})
