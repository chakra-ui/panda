import { defineConfig } from 'tsup'

// Two independent builds. The Node entry (`index`) needs tsup's `--shims` to
// resolve the relative dynamic `import('../pkg-node/...')` (it injects an
// esm-shim chunk that computes `__dirname` via `fileURLToPath`). The browser
// entry (`web`) must NOT get that shim — `fileURLToPath` is undefined under a
// browser bundler that stubs `node:url`, and the facade never needs `__dirname`.
// `--shims` is per-invocation, so the entries are built separately; `web` keeps
// `clean: false` so it doesn't wipe the `index` output built just before it.
export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    shims: true,
    dts: true,
    clean: true,
  },
  {
    entry: ['src/web.ts'],
    format: ['cjs', 'esm'],
    shims: false,
    dts: true,
    clean: false,
  },
])
