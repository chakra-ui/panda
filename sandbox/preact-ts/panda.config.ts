import { defineConfig } from '@pandacss/dev'

export default defineConfig({
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
      recipes: {
        btn: {
          base: {
            color: 'blue.500',
          },
        },
      },
    },
  },
  importMap: ['styled-system', '#styles'],
})
