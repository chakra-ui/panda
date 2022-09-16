import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/shared.ts'],
  splitting: false,
  format: ['esm', 'cjs'],
})
