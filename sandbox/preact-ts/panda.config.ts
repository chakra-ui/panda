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
  utilities: {
    extend: {
      filter: {
        values: 'filters',
      },
    },
  },
  theme: {
    extend: {
      tokens: {
        colors: {
          foreground: { value: '#ebdbb2' },
        },
        filters: {
          blurry: {
            value: 'blur(5px)',
          },
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
