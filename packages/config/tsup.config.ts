import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/merge-config.ts', 'src/diff-config.ts', 'src/resolve-ts-path-pattern.ts'],
  format: ['esm'],
})
