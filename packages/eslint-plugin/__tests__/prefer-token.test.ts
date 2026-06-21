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
  const dir = mkdtempSync(join(tmpdir(), 'panda-prefer-token-'))
  writeFileSync(
    join(dir, 'panda.config.ts'),
    `export default {
      outdir: 'styled-system',
      importMap: { css: ['@panda/css'] },
      theme: {
        tokens: {
          colors: { red: { 500: { value: '#f00' } } },
          spacing: { 4: { value: '1rem' } },
        },
      },
      utilities: {
        color: { className: 'c', values: 'colors' },
        padding: { className: 'p', values: 'spacing', shorthand: 'p' },
        margin: { className: 'm', values: 'spacing', shorthand: 'm' },
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
const withCss = (...lines: string[]) => ["import { css } from '@panda/css'", ...lines].join('\n')

ruleTester.run('prefer-token', asRule(plugin.rules['prefer-token']), {
  valid: [
    // Token values and a CSS keyword resolve fine.
    { filename: 'app.tsx', code: withCss("css({ color: 'red.500', padding: '4' })") },
    { filename: 'app.tsx', code: withCss("css({ margin: 'auto' })") },
    // `allow` permits a specific raw value.
    {
      filename: 'app.tsx',
      code: withCss("css({ color: '#fff' })"),
      options: [{ allow: ['#fff'] }],
    },
    // `categories` narrows scope: a hardcoded color is ignored when only spacing is enforced.
    {
      filename: 'app.tsx',
      code: withCss("css({ color: '#fff' })"),
      options: [{ categories: ['spacing'] }],
    },
  ],
  invalid: [
    // Default scope enforces every token-backed category.
    {
      filename: 'app.tsx',
      code: withCss("css({ color: '#fff' })"),
      errors: [{ message: 'Use a colors token instead of the hardcoded value "#fff".' }],
    },
    {
      filename: 'app.tsx',
      code: withCss("css({ padding: '16px' })"),
      errors: [{ message: 'Use a spacing token instead of the hardcoded value "16px".' }],
    },
    // `categories: ['spacing']` flags the spacing value only.
    {
      filename: 'app.tsx',
      code: withCss("css({ color: '#fff', padding: '16px' })"),
      options: [{ categories: ['spacing'] }],
      errors: [{ message: 'Use a spacing token instead of the hardcoded value "16px".' }],
    },
  ],
})
