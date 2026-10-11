import type { ESLint, Linter } from 'eslint'
import { defineConfig } from 'eslint/config'
import { expectTypeOf, test } from 'vitest'
import type { PandaFlatConfig, PandaPlugin } from '../src'

// Compile-time only: `pnpm typecheck` fails if the public types drift from ESLint's.
test('recommended() fits ESLint flat config types', () => {
  expectTypeOf<PandaFlatConfig>().toExtend<Linter.Config>()
  expectTypeOf<PandaPlugin['rules']>().toExtend<NonNullable<ESLint.Plugin['rules']>>()
  const typed = (config: PandaFlatConfig) => defineConfig([config, { rules: { '@pandacss/no-important': 'error' } }])
  expectTypeOf(typed).returns.toEqualTypeOf<Linter.Config[]>()
})
