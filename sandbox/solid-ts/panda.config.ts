import { defineConfig } from 'css-panda'

export default defineConfig({
  include: ['src/**/*.tsx'],
  outdir: 'panda',
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  jsx: { framework: 'solid' },
})
