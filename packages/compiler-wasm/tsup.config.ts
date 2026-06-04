import { defineConfig } from 'tsup'

// Node entry needs `shims` for its dynamic `import('../pkg-node/...')`; the
// browser entry must not (its `fileURLToPath` is stubbed). Built separately so
// `web` keeps `clean: false` and doesn't wipe the `index` output.
export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    shims: true,
    dts: true,
    clean: true,
  },
  {
    entry: ['src/web.ts'],
    format: ['esm'],
    shims: false,
    dts: true,
    clean: false,
  },
])
