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
      importMap: { css: ['@panda/css'], jsx: ['@panda/jsx'] },
      theme: {
        tokens: {
          colors: { red: { 500: { value: '#f00' } } },
          spacing: { 4: { value: '1rem' } },
        },
        semanticTokens: {
          colors: { fg: { error: { value: '{colors.red.500}' } } },
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
    { filename: 'app.tsx', code: withCss("css({ color: 'red.500', padding: '4' })") },
    { filename: 'app.tsx', code: withCss("css({ margin: 'auto' })") },
    { filename: 'app.tsx', code: withCss("css({ color: '#fff' })"), options: [{ allow: ['#fff'] }] },
    // `categories` narrows scope: a hardcoded color is ignored when only spacing is enforced.
    { filename: 'app.tsx', code: withCss("css({ color: '#fff' })"), options: [{ categories: ['spacing'] }] },
  ],
  invalid: [
    // Lists matching tokens (semantic first) and offers each as a quick-fix.
    {
      filename: 'app.tsx',
      code: withCss("css({ color: '#f00' })"),
      errors: [
        {
          message: 'Hardcoded colors value "#f00". Matching tokens: fg.error, red.500.',
          suggestions: [
            { desc: 'Use the token "fg.error"', output: withCss("css({ color: 'fg.error' })") },
            { desc: 'Use the token "red.500"', output: withCss("css({ color: 'red.500' })") },
          ],
        },
      ],
    },
    // Dimension normalization (16px → 1rem → spacing.4) + a single quick-fix.
    {
      filename: 'app.tsx',
      code: withCss("css({ padding: '16px' })"),
      errors: [
        {
          message: 'Hardcoded spacing value "16px". Matching tokens: 4.',
          suggestions: [{ desc: 'Use the token "4"', output: withCss("css({ padding: '4' })") }],
        },
      ],
    },
    // No matching token: generic message, no quick-fix.
    {
      filename: 'app.tsx',
      code: withCss("css({ color: '#abc' })"),
      errors: [{ message: 'Use a colors token instead of the hardcoded value "#abc".', suggestions: [] }],
    },
    // A value nested in a per-prop condition is still fixable (leaf span).
    {
      filename: 'app.tsx',
      code: withCss("css({ color: { base: '#f00' } })"),
      errors: [
        {
          message: 'Hardcoded colors value "#f00". Matching tokens: fg.error, red.500.',
          suggestions: [
            { desc: 'Use the token "fg.error"', output: withCss("css({ color: { base: 'fg.error' } })") },
            { desc: 'Use the token "red.500"', output: withCss("css({ color: { base: 'red.500' } })") },
          ],
        },
      ],
    },
    // `categories` scopes which categories are checked.
    {
      filename: 'app.tsx',
      code: withCss("css({ color: '#f00', padding: '16px' })"),
      options: [{ categories: ['spacing'] }],
      errors: [
        {
          message: 'Hardcoded spacing value "16px". Matching tokens: 4.',
          suggestions: [{ desc: 'Use the token "4"', output: withCss("css({ color: '#f00', padding: '4' })") }],
        },
      ],
    },
    // A value nested in a responsive array is fixable (per-element leaf span).
    {
      filename: 'app.tsx',
      code: withCss("css({ color: ['#f00', 'red.500'] })"),
      errors: [
        {
          message: 'Hardcoded colors value "#f00". Matching tokens: fg.error, red.500.',
          suggestions: [
            { desc: 'Use the token "fg.error"', output: withCss("css({ color: ['fg.error', 'red.500'] })") },
            { desc: 'Use the token "red.500"', output: withCss("css({ color: ['red.500', 'red.500'] })") },
          ],
        },
      ],
    },
    // JSX `css` prop with an array of style objects (`css={[{...}, {...}]}`).
    {
      filename: 'app.tsx',
      code: [
        "import { styled } from '@panda/jsx'",
        "const A = () => <styled.div css={[{ color: '#f00' }, { padding: '4' }]} />",
      ].join('\n'),
      errors: [
        {
          message: 'Hardcoded colors value "#f00". Matching tokens: fg.error, red.500.',
          suggestions: [
            {
              desc: 'Use the token "fg.error"',
              output: [
                "import { styled } from '@panda/jsx'",
                "const A = () => <styled.div css={[{ color: 'fg.error' }, { padding: '4' }]} />",
              ].join('\n'),
            },
            {
              desc: 'Use the token "red.500"',
              output: [
                "import { styled } from '@panda/jsx'",
                "const A = () => <styled.div css={[{ color: 'red.500' }, { padding: '4' }]} />",
              ].join('\n'),
            },
          ],
        },
      ],
    },
    // `css(a, b)` multi-argument merge — every object argument is inspected.
    {
      filename: 'app.tsx',
      code: withCss("css({ padding: '4' }, { color: '#f00' })"),
      errors: [
        {
          message: 'Hardcoded colors value "#f00". Matching tokens: fg.error, red.500.',
          suggestions: [
            { desc: 'Use the token "fg.error"', output: withCss("css({ padding: '4' }, { color: 'fg.error' })") },
            { desc: 'Use the token "red.500"', output: withCss("css({ padding: '4' }, { color: 'red.500' })") },
          ],
        },
      ],
    },
    // `cva` recipe styles (base / variants / compoundVariants) are covered.
    {
      filename: 'app.tsx',
      code: ["import { cva } from '@panda/css'", "cva({ base: { color: '#f00' } })"].join('\n'),
      errors: [
        {
          message: 'Hardcoded colors value "#f00". Matching tokens: fg.error, red.500.',
          suggestions: [
            {
              desc: 'Use the token "fg.error"',
              output: ["import { cva } from '@panda/css'", "cva({ base: { color: 'fg.error' } })"].join('\n'),
            },
            {
              desc: 'Use the token "red.500"',
              output: ["import { cva } from '@panda/css'", "cva({ base: { color: 'red.500' } })"].join('\n'),
            },
          ],
        },
      ],
    },
    // `styled('div', { ... })` factory recipe config is covered.
    {
      filename: 'app.tsx',
      code: ["import { styled } from '@panda/jsx'", "styled('div', { base: { color: '#f00' } })"].join('\n'),
      errors: [
        {
          message: 'Hardcoded colors value "#f00". Matching tokens: fg.error, red.500.',
          suggestions: [
            {
              desc: 'Use the token "fg.error"',
              output: ["import { styled } from '@panda/jsx'", "styled('div', { base: { color: 'fg.error' } })"].join(
                '\n',
              ),
            },
            {
              desc: 'Use the token "red.500"',
              output: ["import { styled } from '@panda/jsx'", "styled('div', { base: { color: 'red.500' } })"].join(
                '\n',
              ),
            },
          ],
        },
      ],
    },
  ],
})
