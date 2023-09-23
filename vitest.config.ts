import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

const resolve = (val: string) => new URL(val, import.meta.url).pathname

export default defineConfig({
  root: process.cwd(),
  plugins: [tsconfigPaths()],
  test: {
    setupFiles: ['tests-setup.ts'],
    hideSkippedTests: true,
    environment: 'happy-dom',
  },
  resolve: {
    alias: [
      {
        find: '@pandacss/config/ts-path',
        replacement: resolve('./packages/config/src/resolve-ts-path-pattern.ts'),
      },
      {
        find: '@pandacss/dev',
        replacement: resolve('./packages/cli/src'),
      },
      {
        find: /^@pandacss\/(.*)$/,
        replacement: resolve('./packages/$1/src'),
      },
    ],
  },
})
