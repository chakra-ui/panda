import { defineConfig } from 'vitest/config'

// No root `@pandacss/*` → `packages/*/src` alias. Legacy comparison pins
// (`@pandacss/node`, extractor, presets, …) must resolve from this package.
export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 120_000,
  },
})
