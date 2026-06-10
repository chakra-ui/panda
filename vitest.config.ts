import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import virtual from 'vite-plugin-virtual'

const resolve = (val: string) => new URL(val, import.meta.url).pathname

function virtualPanda() {
  return virtual({
    'virtual:panda': 'export const config = {}',
  })
}

export default defineConfig({
  root: process.cwd(),
  plugins: [tsconfigPaths(), virtualPanda()],
  test: {
    globals: true,
    testTimeout: 15_000,
    setupFiles: [resolve('./tests-setup.ts')],
    hideSkippedTests: true,
    environment: 'happy-dom',
    // https://vitest.dev/config/#exclude defaults + non-workspace sandboxes
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      'sandbox/codegen/__tests__/frameworks',
      // playground and website are out of the workspace until migrated to the
      // Rust compiler stack — their tests can't resolve deps from root.
      'playground/**',
      'website/**',
      // Binding tests need `snapshotFormat.compareKeys: null` to preserve the
      // JSON key order coming from the Rust binding. Run them via
      // `pnpm --filter @pandacss/compiler test` which picks up the local config.
      'packages/compiler/__tests__/**',
    ],
  },
  resolve: {
    alias: [
      {
        find: /^@pandacss\/(.*)$/,
        replacement: resolve('./packages/$1/src'),
      },
    ],
  },
})
