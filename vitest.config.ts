import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    setupFiles: ['tests-setup.ts'],
  },
  resolve: {
    alias: [
      {
        find: /^@pandacss\/(.*)$/,
        replacement: path.resolve('./packages/$1/src'),
      },
    ],
  },
})
