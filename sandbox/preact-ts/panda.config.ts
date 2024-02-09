import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  conditions: {
    mq: '@media (min-width: 640px)',
    custom: '&[data-custom]',
    supportHover: ['@media (hover: hover) and (pointer: fine)', '@supports (display: grid)', '&:hover'],
  },
  preflight: true,
  include: ['./src/**/*.{tsx,jsx}', './pages/**/*.{jsx,tsx}'],
  exclude: [],
  outdir: 'styled-system',
  jsxFramework: 'preact',
  patterns: {
    extend: {
      stack: {
        defaultValues: {
          gap: '0',
        },
      },
    },
  },
  theme: {
    extend: {
      tokens: {
        colors: {
          aaa: { value: 'azaz23' },
        },
      },
    },
  },
})
