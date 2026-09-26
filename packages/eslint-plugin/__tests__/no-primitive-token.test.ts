import { createPandaRuleTester, withCss } from './panda-rule-tester'

const ruleTester = await createPandaRuleTester(`export default {
  outdir: 'styled-system',
  importMap: {
    css: ['@panda/css'],
    tokens: ['@panda/tokens'],
    jsx: ['@panda/jsx'],
  },
  theme: {
    tokens: {
      colors: {
        red: { 500: { value: '#f00' } },
        blue: { 500: { value: '#00f' } },
        gray: { 500: { value: '#888' } },
      },
      spacing: { 4: { value: '1rem' } },
    },
    semanticTokens: {
      colors: {
        fg: {
          error: { value: '{colors.red.500}' },
          accent: { value: '{colors.blue.500}' },
        },
      },
    },
  },
  utilities: {
    color: { className: 'c', values: 'colors' },
    backgroundColor: { className: 'bg', values: 'colors', shorthand: 'bg' },
    padding: { className: 'p', values: 'spacing', shorthand: 'p' },
  },
}`)

ruleTester.run('no-primitive-token', {
  valid: [
    { filename: 'app.tsx', code: withCss("css({ color: 'fg.error', bg: 'fg.accent' })") },
    // Spacing has primitive tokens but no semantic tokens, so it is skipped by default.
    { filename: 'app.tsx', code: withCss("css({ padding: '4' })") },
    // Hardcoded values belong to `prefer-token`, not this rule.
    { filename: 'app.tsx', code: withCss("css({ color: '#f00' })") },
    { filename: 'app.tsx', code: withCss("css({ color: 'red.500' })"), options: [{ allow: ['red.500'] }] },
    { filename: 'app.tsx', code: withCss("css({ color: 'red.500' })"), options: [{ allow: ['colors.red.500'] }] },
    { filename: 'app.tsx', code: withCss("css({ color: 'red.500' })"), options: [{ categories: ['spacing'] }] },
    {
      filename: 'app.tsx',
      code: ["import { token } from '@panda/tokens'", "token('colors.fg.error')"].join('\n'),
    },
  ],
  invalid: [
    {
      filename: 'app.tsx',
      code: withCss("css({ color: 'red.500' })"),
      errors: [
        {
          message: 'Use a semantic colors token instead of the primitive token "red.500".',
          suggestions: [{ desc: 'Use the semantic token "fg.error"', output: withCss("css({ color: 'fg.error' })") }],
        },
      ],
    },
    {
      filename: 'app.tsx',
      code: withCss("css({ color: { base: 'red.500' } })"),
      errors: [
        {
          message: 'Use a semantic colors token instead of the primitive token "red.500".',
          suggestions: [
            { desc: 'Use the semantic token "fg.error"', output: withCss("css({ color: { base: 'fg.error' } })") },
          ],
        },
      ],
    },
    {
      filename: 'app.tsx',
      code: withCss("css({ color: 'red.500/40' })"),
      errors: [
        {
          message: 'Use a semantic colors token instead of the primitive token "red.500".',
          suggestions: [
            { desc: 'Use the semantic token "fg.error/40"', output: withCss("css({ color: 'fg.error/40' })") },
          ],
        },
      ],
    },
    {
      filename: 'app.tsx',
      code: ["import { token } from '@panda/tokens'", "const error = token('colors.red.500')"].join('\n'),
      errors: [
        {
          message: 'Use a semantic colors token instead of the primitive token "red.500".',
          suggestions: [
            {
              desc: 'Use the semantic token "colors.fg.error"',
              output: ["import { token } from '@panda/tokens'", "const error = token('colors.fg.error')"].join('\n'),
            },
          ],
        },
      ],
    },
    {
      filename: 'app.tsx',
      code: ["import { token } from '@panda/tokens'", "const error = token('colors.red.500/40')"].join('\n'),
      errors: [
        {
          message: 'Use a semantic colors token instead of the primitive token "red.500".',
          suggestions: [
            {
              desc: 'Use the semantic token "colors.fg.error/40"',
              output: ["import { token } from '@panda/tokens'", "const error = token('colors.fg.error/40')"].join('\n'),
            },
          ],
        },
      ],
    },
    {
      filename: 'app.tsx',
      code: withCss("css({ bg: 'blue.500' })"),
      errors: [
        {
          message: 'Use a semantic colors token instead of the primitive token "blue.500".',
          suggestions: [
            {
              desc: 'Use the semantic token "fg.accent"',
              output: withCss("css({ bg: 'fg.accent' })"),
            },
          ],
        },
      ],
    },
    {
      filename: 'app.tsx',
      code: withCss("css({ color: 'gray.500' })"),
      errors: [
        {
          message: 'Use a semantic colors token instead of the primitive token "gray.500".',
          suggestions: [],
        },
      ],
    },
  ],
})
