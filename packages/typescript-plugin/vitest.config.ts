import { defineConfig } from 'vitest/config'

const resolve = (path: string) => new URL(path, import.meta.url).pathname

// Mirrors packages/eslint-plugin/vitest.config.ts: resolves workspace deps to
// `src` so the loader finds the native binding next to the real
// `@pandacss/compiler` package, in the node environment (not the root
// config's happy-dom).
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
