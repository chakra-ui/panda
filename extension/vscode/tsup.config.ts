import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/server.ts'],
  format: ['cjs'],
  external: ['vscode', 'esbuild'],
  minify: true,
  outDir: 'dist',
  clean: true,
  shims: true,
})
