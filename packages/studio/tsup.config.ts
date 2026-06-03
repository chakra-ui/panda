import { defineConfig } from 'tsup'

// tsup's DTS pipeline still applies `baseUrl` internally under TS 6 (TS5101).
// Overrides here only affect declaration emit, not application tsconfig.
export default defineConfig({
  entry: ['scripts/studio.ts'],
  format: ['esm'],
  splitting: false,
  dts: {
    compilerOptions: {
      ignoreDeprecations: '6.0',
    },
  },
})
