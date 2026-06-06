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
        find: '@pandacss/config-loader',
        replacement: resolve('../config-loader/src'),
      },
    ],
  },
})
