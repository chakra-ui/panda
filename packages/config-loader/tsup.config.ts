import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/serialize.ts'],
  format: ['esm'],
  platform: 'node',
})
