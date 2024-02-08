import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/classname.ts'],
  format: ['cjs', 'esm'],
})
