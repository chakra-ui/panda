import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/cli-default.ts', 'src/index.ts', 'src/presets.ts'],
  format: ['esm', 'cjs'],
  splitting: false,
  shims: true,
  clean: true,
  platform: 'node',
  target: 'node18',
})
