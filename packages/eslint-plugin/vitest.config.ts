import { defineConfig } from 'vitest/config'

const resolve = (path: string) => new URL(path, import.meta.url).pathname

// The integration suite drives a real Panda compiler, so it needs the native
// binding. Run in the node environment (not the root config's happy-dom) and
// resolve workspace deps to `src` so the loader finds `binding.cjs` next to the
// real `@pandacss/compiler` package.
export default defineConfig({
  test: {
    environment: 'node',
  },
  resolve: {
    alias: [
      { find: '@pandacss/compiler', replacement: resolve('../compiler/src') },
      { find: '@pandacss/compiler-shared', replacement: resolve('../compiler-shared/src') },
      { find: '@pandacss/config', replacement: resolve('../config/src') },
      { find: '@pandacss/types', replacement: resolve('../types/src') },
      { find: '@pandacss/preset-base', replacement: resolve('../preset-base/src') },
      { find: '@pandacss/preset-panda', replacement: resolve('../preset-panda/src') },
    ],
  },
})
