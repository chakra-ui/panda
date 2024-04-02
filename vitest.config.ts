import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

const resolve = (val: string) => new URL(val, import.meta.url).pathname

export default defineConfig({
  root: process.cwd(),
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    setupFiles: ['tests-setup.ts'],
    hideSkippedTests: true,
    environment: 'happy-dom',
    // https://vitest.dev/config/#exclude defaults + sandbox/codegen/frameworks
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      'sandbox/codegen/__tests__/frameworks',
    ],
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
