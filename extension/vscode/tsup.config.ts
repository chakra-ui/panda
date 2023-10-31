import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/server.ts'],
  format: ['cjs'],
  external: ['vscode', 'esbuild', 'lightningcss'],
  minify: true,
  outDir: 'dist',
  clean: true,
  shims: true,
})
