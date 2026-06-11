import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/serialize.ts', 'src/merge.ts'],
  format: ['esm'],
  platform: 'node',
})
