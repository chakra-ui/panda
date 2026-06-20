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
  const dir = mkdtempSync(join(tmpdir(), 'panda-style-rules-'))
  writeFileSync(
    join(dir, 'panda.config.ts'),
    `export default {
      outdir: 'styled-system',
      importMap: { css: ['@panda/css'] },
      theme: {
        tokens: { colors: { red: { 500: { value: '#f00' } } }, spacing: { 4: { value: '1rem' } } },
        textStyles: { heading: { value: { fontSize: '2xl', fontWeight: 'bold' } } },
      },
      utilities: {
        color: { className: 'c', values: 'colors' },
        margin: { className: 'm', shorthand: 'm' },
        marginInline: { className: 'mx', shorthand: 'mx' },
        marginTop: { className: 'mt', shorthand: 'mt' },
        marginLeft: { className: 'ml', shorthand: 'ml' },
        marginInlineStart: { className: 'ms' },
        padding: { className: 'p', shorthand: 'p' },
        gap: { className: 'gap' },
        left: { className: 'left' },
        insetInlineStart: { className: 'start' },
        fontSize: { className: 'fs' },
        fontWeight: { className: 'fw' },
        lineHeight: { className: 'lh' },
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

ruleTester.run('no-important', asRule(plugin.rules['no-important']), {
  valid: [{ filename: 'app.tsx', code: withCss("css({ color: 'red.500' })") }],
  invalid: [
    {
      filename: 'app.tsx',
      code: withCss("css({ color: 'red.500!' })"),
      errors: [{ message: 'Avoid `!important`; it escalates specificity and is hard to override.' }],
    },
    {
      filename: 'app.tsx',
      code: withCss("css({ _hover: { color: 'red.500 !important' } })"),
      errors: [{ message: 'Avoid `!important`; it escalates specificity and is hard to override.' }],
    },
  ],
})

ruleTester.run('no-margin-properties', asRule(plugin.rules['no-margin-properties']), {
  valid: [{ filename: 'app.tsx', code: withCss("css({ padding: '4', gap: '4' })") }],
  invalid: [
    {
      filename: 'app.tsx',
      code: withCss("css({ mt: '4' })"),
      errors: [{ message: 'Avoid margin properties; prefer `gap` or a layout pattern for spacing.' }],
    },
    {
      filename: 'app.tsx',
      code: withCss("css({ marginInline: '4' })"),
      errors: [{ message: 'Avoid margin properties; prefer `gap` or a layout pattern for spacing.' }],
    },
  ],
})

ruleTester.run('no-physical-properties', asRule(plugin.rules['no-physical-properties']), {
  valid: [{ filename: 'app.tsx', code: withCss("css({ insetInlineStart: '0', marginInlineStart: '4' })") }],
  invalid: [
    {
      filename: 'app.tsx',
      code: withCss("css({ left: '0' })"),
      errors: [{ message: 'Use the logical property "insetInlineStart" instead of the physical "left".' }],
    },
    {
      filename: 'app.tsx',
      code: withCss("css({ ml: '4' })"),
      errors: [{ message: 'Use the logical property "marginInlineStart" instead of the physical "marginLeft".' }],
    },
  ],
})

ruleTester.run('prefer-text-style', asRule(plugin.rules['prefer-text-style']), {
  valid: [
    // A single typography property is fine.
    { filename: 'app.tsx', code: withCss("css({ fontSize: '2xl', color: 'red.500' })") },
  ],
  invalid: [
    {
      filename: 'app.tsx',
      code: withCss("css({ fontSize: '2xl', fontWeight: 'bold' })"),
      errors: [{ message: 'Multiple typography properties set together; prefer a `textStyle` token.' }],
    },
    {
      filename: 'app.tsx',
      code: withCss("css({ _hover: { fontSize: '2xl', lineHeight: '1.2' } })"),
      errors: [{ message: 'Multiple typography properties set together; prefer a `textStyle` token.' }],
    },
  ],
})
