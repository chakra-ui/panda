import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import tsParser from '@typescript-eslint/parser'
import { type Rule, RuleTester } from 'eslint'
import { afterAll, describe, it } from 'vitest'
import { createPandaPlugin } from '../src'
import type { RuleModuleLike } from '../src/rules/shared'

// Wire ESLint's RuleTester to vitest's test hooks so its `run()` suites are
// collected (otherwise vitest reports "No test suite found").
const hooks = RuleTester as unknown as {
  afterAll: typeof afterAll
  describe: typeof describe
  it: typeof it
  itOnly: typeof it.only
}
hooks.afterAll = afterAll
hooks.describe = describe
hooks.it = it
hooks.itOnly = it.only

// The core rule modules are structurally minimal; cast to ESLint's Rule shape
// at the RuleTester boundary.
const asRule = (rule: RuleModuleLike) => rule as unknown as Rule.RuleModule

function createTempProject() {
  const dir = mkdtempSync(join(tmpdir(), 'panda-eslint-rt-'))
  writeFileSync(
    join(dir, 'panda.config.ts'),
    `export default {
      outdir: 'styled-system',
      importMap: {
        css: ['@panda/css'],
        tokens: ['@panda/tokens'],
      },
      theme: {
        tokens: {
          colors: {
            red: { 500: { value: '#f00' } },
            old: { value: '#000', deprecated: true },
          },
        },
      },
      utilities: {
        color: { className: 'c', values: 'colors' },
      },
    }`,
  )
  return dir
}

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
})

const dir = createTempProject()
const plugin = await createPandaPlugin({ cwd: dir })

ruleTester.run('no-invalid-token-paths', asRule(plugin.rules['no-invalid-token-paths']), {
  valid: [
    {
      filename: 'app.tsx',
      code: [
        "import { css } from '@panda/css'",
        "import { token } from '@panda/tokens'",
        "css({ color: token('colors.red.500') })",
      ].join('\n'),
    },
  ],
  invalid: [
    {
      filename: 'app.tsx',
      code: [
        "import { css } from '@panda/css'",
        "import { token } from '@panda/tokens'",
        "css({ color: token('colors.ghost') })",
      ].join('\n'),
      errors: [{ message: 'Panda token "colors.ghost" was not found.' }],
    },
  ],
})

// no-deprecated has its own real-world suite in no-deprecated.test.ts.

ruleTester.run('no-debug', asRule(plugin.rules['no-debug']), {
  valid: [
    {
      filename: 'app.tsx',
      code: ["import { css } from '@panda/css'", "css({ color: 'red.500' })"].join('\n'),
    },
  ],
  invalid: [
    {
      filename: 'app.tsx',
      code: ["import { css } from '@panda/css'", "css({ debug: true, color: 'red.500' })"].join('\n'),
      errors: [{ message: 'Remove the `debug` property; it logs generated styles and should not ship.' }],
    },
  ],
})

// Colors are covered by prefer-token (see prefer-token.test.ts).
