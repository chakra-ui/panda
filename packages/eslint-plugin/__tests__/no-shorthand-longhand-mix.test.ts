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
  const dir = mkdtempSync(join(tmpdir(), 'panda-shorthand-mix-'))
  writeFileSync(
    join(dir, 'panda.config.ts'),
    `export default {
      outdir: 'styled-system',
      importMap: { css: ['@panda/css'], jsx: ['@panda/jsx'] },
      theme: {
        tokens: { colors: { red: { 500: { value: '#f00' } } }, spacing: { 4: { value: '1rem' } } },
      },
      utilities: {
        color: { className: 'c', values: 'colors' },
        margin: { className: 'm', shorthand: 'm' },
        marginLeft: { className: 'ml', shorthand: 'ml' },
        marginTop: { className: 'mt' },
        padding: { className: 'p', shorthand: 'p' },
        border: { className: 'bd' },
        borderColor: { className: 'bc', values: 'colors' },
        borderWidth: { className: 'bw' },
        borderRadius: { className: 'br' },
        borderTopLeftRadius: { className: 'btlr' },
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

const message = (shorthand: string, ...pieces: string[]) => {
  const list = pieces.map((piece) => `"${piece}"`).join(', ')
  return `"${shorthand}" is mixed with ${list}. Panda emits longhands after shorthands, so ${list} will win regardless of source order; use the longhand properties for a predictable result.`
}

ruleTester.run('no-shorthand-longhand-mix', asRule(plugin.rules['no-shorthand-longhand-mix']), {
  valid: [
    // Unrelated shorthands - not the same group.
    { filename: 'app.tsx', code: withCss("css({ margin: '4', padding: '4' })") },
    // Only longhands - nothing to mix.
    { filename: 'app.tsx', code: withCss("css({ marginTop: '4', marginLeft: '5' })") },
    // Shorthand and piece live in different scopes (base vs condition).
    { filename: 'app.tsx', code: withCss("css({ margin: '4', _hover: { marginLeft: '5' } })") },
    // The group is opted out via `ignore`.
    {
      filename: 'app.tsx',
      code: withCss("css({ margin: '4', marginLeft: '5' })"),
      options: [{ ignore: ['margin'] }],
    },
  ],
  invalid: [
    // Shorthand + its own piece in one object.
    {
      filename: 'app.tsx',
      code: withCss("css({ margin: '4', marginLeft: '5' })"),
      errors: [{ message: message('margin', 'marginLeft') }],
    },
    // Panda shorthands resolve to their canonical names before comparison.
    {
      filename: 'app.tsx',
      code: withCss("css({ m: '4', ml: '5' })"),
      errors: [{ message: message('margin', 'marginLeft') }],
    },
    // Composite color shorthand vs the `border` shorthand that contains it.
    {
      filename: 'app.tsx',
      code: withCss("css({ border: '1px solid', borderColor: 'red.500' })"),
      errors: [{ message: message('border', 'borderColor') }],
    },
    // Radius shorthand vs a corner piece.
    {
      filename: 'app.tsx',
      code: withCss("css({ borderRadius: '4', borderTopLeftRadius: '2' })"),
      errors: [{ message: message('borderRadius', 'borderTopLeftRadius') }],
    },
    // Inside a recipe style object (cva base).
    {
      filename: 'app.tsx',
      code: ["import { cva } from '@panda/css'", "cva({ base: { margin: '4', marginLeft: '5' } })"].join('\n'),
      errors: [{ message: message('margin', 'marginLeft') }],
    },
    // JSX style props on a Panda factory element.
    {
      filename: 'app.tsx',
      code: [
        "import { styled } from '@panda/jsx'",
        "const A = () => <styled.div border='1px' borderColor='red.500' />",
      ].join('\n'),
      errors: [{ message: message('border', 'borderColor') }],
    },
  ],
})
