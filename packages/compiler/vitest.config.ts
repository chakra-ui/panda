import { defineConfig } from 'vitest/config'

const resolve = (path: string) => new URL(path, import.meta.url).pathname

export default defineConfig({
  test: {
    snapshotFormat: {
      compareKeys: null,
    },
  },
  resolve: {
    alias: [
      {
        find: '@pandacss/config',
        replacement: resolve('../config/src'),
      },
      {
        find: '@pandacss/compiler-shared',
        replacement: resolve('../compiler-shared/src'),
      },
      {
        find: '@pandacss/types',
        replacement: resolve('../types/src'),
      },
      {
        find: '@pandacss/preset-base',
        replacement: resolve('../preset-base/src'),
      },
      {
        find: '@pandacss/preset-panda',
        replacement: resolve('../preset-panda/src'),
      },
    ],
  },
})
