import type { ESLint } from 'eslint'
import { defineConfig } from 'eslint/config'
import { expectTypeOf, test } from 'vitest'
import type { PandaFlatConfig, PandaPlugin } from '../src'

// Compile-time only: `pnpm typecheck` fails if the public types drift from ESLint's.
test('recommended() type-checks inside defineConfig in eslint.config.ts', () => {
  const config = (recommended: PandaFlatConfig) => defineConfig([recommended])
  expectTypeOf(config).toBeFunction()
  expectTypeOf<PandaPlugin['rules']>().toExtend<NonNullable<ESLint.Plugin['rules']>>()
})
