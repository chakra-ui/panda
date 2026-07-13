import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  presets: ['@pandacss/preset-base', '@pandacss/preset-panda'],
  preflight: true,
  include: ['./src/**/*.{ts,tsx}'],
  exclude: [],
  outdir: 'styled-system',
  jsxFramework: 'react',
  theme: {
    extend: {
      recipes: {
        button: {
          className: 'button',
          jsx: ['Button'],
          base: { display: 'inline-flex', borderRadius: 'md' },
          defaultVariants: { size: 'md' },
          variants: {
            size: {
              sm: { paddingX: '3', fontSize: 'sm' },
              md: { paddingX: '4', fontSize: 'md' },
            },
          },
        },
      },
    },
  },
})
