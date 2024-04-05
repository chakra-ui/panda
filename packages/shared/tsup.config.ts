import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/shared.ts', 'src/astish.ts', 'src/normalize-html.ts', 'src/css-var.ts'],
  splitting: false,
  format: ['esm', 'cjs'],
})
