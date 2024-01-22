import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/utils/worker.ts'],
  format: ['esm', 'cjs'],
  shims: true,
})
