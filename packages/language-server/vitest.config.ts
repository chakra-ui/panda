import { defineConfig } from 'vitest/config'

const resolve = (path: string) => new URL(path, import.meta.url).pathname

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
      { find: '@pandacss/typescript-plugin', replacement: resolve('../typescript-plugin/src') },
    ],
  },
})
