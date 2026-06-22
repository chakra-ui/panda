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

function createTempProject() {
  const dir = mkdtempSync(join(tmpdir(), 'panda-invalid-nesting-'))
  writeFileSync(
    join(dir, 'panda.config.ts'),
    `export default {
      outdir: 'styled-system',
      importMap: { css: ['@panda/css'] },
      theme: { tokens: { colors: { red: { 500: { value: '#f00' } } } } },
      utilities: { color: { className: 'c', values: 'colors' } },
      conditions: { hover: '&:hover' },
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
const withCss = (...lines: string[]) => ["import { css } from '@panda/css'", ...lines].join('\n')

const message = (name: string) =>
  `Nested selector "${name}" has no "&", so Panda ignores it. Use "&${name}" or a condition like "_hover".`

ruleTester.run('no-invalid-nesting', asRule(plugin.rules['no-invalid-nesting']), {
  valid: [
    // Proper `&` selector.
    { filename: 'app.tsx', code: withCss("css({ '&:hover': { color: 'red.500' } })") },
    // Panda condition.
    { filename: 'app.tsx', code: withCss("css({ _hover: { color: 'red.500' } })") },
    // At-rule.
    { filename: 'app.tsx', code: withCss("css({ '@media (min-width: 700px)': { color: 'red.500' } })") },
    // A per-prop condition object on a normal property is not nesting.
    { filename: 'app.tsx', code: withCss("css({ color: { base: 'red.500' } })") },
  ],
  invalid: [
    // Pseudo without `&`, with a quick-fix suggestion.
    {
      filename: 'app.tsx',
      code: withCss("css({ ':hover': { color: 'red.500' } })"),
      errors: [
        {
          message: message(':hover'),
          suggestions: [
            { desc: 'Prefix with "&" → "&:hover"', output: withCss("css({ '&:hover': { color: 'red.500' } })") },
          ],
        },
      ],
    },
    // Class selector without `&`.
    {
      filename: 'app.tsx',
      code: withCss("css({ '.foo': { color: 'red.500' } })"),
      errors: [
        {
          message: message('.foo'),
          suggestions: [
            { desc: 'Prefix with "&" → "&.foo"', output: withCss("css({ '&.foo': { color: 'red.500' } })") },
          ],
        },
      ],
    },
    // Combinator without `&`.
    {
      filename: 'app.tsx',
      code: withCss("css({ '> div': { color: 'red.500' } })"),
      errors: [
        {
          message: message('> div'),
          suggestions: [
            { desc: 'Prefix with "&" → "&> div"', output: withCss("css({ '&> div': { color: 'red.500' } })") },
          ],
        },
      ],
    },
    // Inside a recipe (cva) base — surfaces as a recipe-variant entry.
    {
      filename: 'app.tsx',
      code: ["import { cva } from '@panda/css'", "cva({ base: { ':hover': { color: 'red.500' } } })"].join('\n'),
      errors: [
        {
          message: message(':hover'),
          suggestions: [
            {
              desc: 'Prefix with "&" → "&:hover"',
              output: ["import { cva } from '@panda/css'", "cva({ base: { '&:hover': { color: 'red.500' } } })"].join(
                '\n',
              ),
            },
          ],
        },
      ],
    },
  ],
})
