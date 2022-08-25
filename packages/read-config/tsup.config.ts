import { defineConfig } from 'tsup'

export default defineConfig({
  platform: 'node',
  target: 'es2020',
  format: ['cjs'],
  shims: true,
})
