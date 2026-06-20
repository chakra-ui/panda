import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import tsParser from '@typescript-eslint/parser'
import { type Rule, RuleTester } from 'eslint'
import { afterAll, describe, it } from 'vitest'
import { createPandaPlugin } from '../src'
import type { RuleModuleLike } from '../src/rules/shared'

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

const asRule = (rule: RuleModuleLike) => rule as unknown as Rule.RuleModule

// Only files matched by `include` are extracted, so a Panda file outside it
// silently produces no CSS — which is what this rule flags.
function createTempProject() {
  const dir = mkdtempSync(join(tmpdir(), 'panda-file-not-included-'))
  writeFileSync(
    join(dir, 'panda.config.ts'),
    `export default {
      outdir: 'styled-system',
      include: ['src/**/*.{ts,tsx}'],
      importMap: { css: ['@panda/css'] },
      theme: { tokens: { colors: { red: { 500: { value: '#f00' } } } } },
      utilities: { color: { className: 'c', values: 'colors' } },
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
const code = ["import { css } from '@panda/css'", "css({ color: 'red.500' })"].join('\n')

ruleTester.run('file-not-included', asRule(plugin.rules['file-not-included']), {
  valid: [
    // Inside `include` — extracted normally.
    { filename: join(dir, 'src/app.tsx'), code },
    // Outside `include` but no Panda usage — nothing to warn about.
    {
      filename: join(dir, 'scripts/build.tsx'),
      code: 'export const noop = () => {}',
    },
  ],
  invalid: [
    // Uses Panda but lives outside `include`: its styles won't be generated.
    {
      filename: join(dir, 'scripts/widget.tsx'),
      code,
      errors: [
        {
          message:
            'This file uses Panda but is not part of the Panda config `include` globs, so its styles will not be generated.',
        },
      ],
    },
  ],
})
