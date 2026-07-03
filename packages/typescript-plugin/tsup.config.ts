import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['src/index.ts', 'src/service/index.ts'],
    format: ['esm'],
    platform: 'node',
  },
  {
    // tsserver's plugin loader does a plain CommonJS `require()` — see plugin.cjs
    // for why the main entry also needs a real CJS build.
    entry: ['src/index.ts'],
    format: ['cjs'],
    platform: 'node',
  },
])
