import { createPandaRuleTester, withCss } from './panda-rule-tester'

const ruleTester = await createPandaRuleTester(`export default {
  outdir: 'styled-system',
  jsxFramework: 'react',
  importMap: { css: ['@panda/css'], jsx: ['@panda/jsx'], tokens: ['@panda/tokens'] },
  conditions: { hover: '&:hover' },
  theme: {
    tokens: {
      colors: { red: { 500: { value: '#f00' } } },
      spacing: { 4: { value: '1rem' } },
      sizes: { 4: { value: '4rem' }, page: { value: '80rem' } },
      fonts: { body: { value: 'Inter' } },
    },
    semanticTokens: {
      colors: {
        fg: { value: { base: '{colors.red.500}', _dark: '#fff' } },
        accent: { DEFAULT: { value: '{colors.red.500}' } },
      },
    },
  },
  utilities: {
    color: { className: 'c', values: 'colors' },
    padding: { className: 'p', values: 'spacing', shorthand: 'p' },
    width: { className: 'w', values: 'sizes' },
    marginBottom: { className: 'mb', values: 'spacing' },
    fontFamily: { className: 'ff', values: 'fonts' },
    border: { className: 'bd', values: 'borders' },
  },
}`)

const withToken = (...lines: string[]) => withCss("import { token } from '@panda/tokens'", ...lines)
const withJsx = (...lines: string[]) =>
  ["import { token } from '@panda/tokens'", "import { styled } from '@panda/jsx'", ...lines].join('\n')

const reference = (replacement: string) => `This token reference isn't needed. Use '${replacement}'.`
const call = (replacement: string) =>
  `token() writes the raw value into the CSS, so theme changes don't reach it. Use '${replacement}'.`

function fixed(code: string, replacement: string, output: string) {
  return {
    filename: 'app.tsx',
    code,
    output,
    errors: [{ message: reference(replacement), suggestions: [{ desc: `Use '${replacement}'`, output }] }],
  }
}

function suggested(code: string, message: string, replacement: string, output: string) {
  return {
    filename: 'app.tsx',
    code,
    output: null,
    errors: [{ message, suggestions: [{ desc: `Use '${replacement}'`, output }] }],
  }
}

ruleTester.run('no-unsafe-token-fn-usage', {
  valid: [
    { filename: 'app.tsx', code: withCss("css({ color: 'red.500', padding: '4' })") },
    { filename: 'app.tsx', code: withCss("css({ border: '1px solid token(colors.red.500)' })") },
    { filename: 'app.tsx', code: withCss("css({ width: 'calc(token(spacing.4) + 2px)' })") },
    { filename: 'app.tsx', code: withCss("css({ color: 'token(colors.red.500, #fff)' })") },
    { filename: 'app.tsx', code: withCss("css({ color: '{colors.red.500} !important' })") },
    { filename: 'app.tsx', code: withCss("css({ color: '{colors.red.500}!' })") },
    { filename: 'app.tsx', code: withCss("css({ color: '{colors.missing}' })") },
    { filename: 'app.tsx', code: withCss("css({ '--accent': '{colors.red.500}' })") },
    { filename: 'app.tsx', code: withCss("const brand = '{colors.red.500}'", 'css({ color: brand })') },
    { filename: 'app.tsx', code: withCss('css({ color: `{colors.${tone}}` })') },
    { filename: 'app.tsx', code: withToken('css({ color: token(`colors.${tone}`) })') },
    { filename: 'app.tsx', code: withJsx("const a = <div style={{ color: token('colors.red.500') }} />") },
    // The plain name would pick a different token (sizes.4) or emit raw text.
    { filename: 'app.tsx', code: withCss("css({ width: '{spacing.4}' })") },
    { filename: 'app.tsx', code: withCss("css({ marginBottom: '{sizes.page}' })") },
    { filename: 'app.tsx', code: withCss("css({ fontFamily: '{colors.red.500}' })") },
  ],
  invalid: [
    {
      filename: 'app.tsx',
      code: withCss("const label = '🎨 café'", "css({ color: '{colors.red.500}' })"),
      output: withCss("const label = '🎨 café'", "css({ color: 'red.500' })"),
      errors: [
        {
          message: reference('red.500'),
          line: 3,
          column: 14,
          endColumn: 32,
          suggestions: [
            { desc: "Use 'red.500'", output: withCss("const label = '🎨 café'", "css({ color: 'red.500' })") },
          ],
        },
      ],
    },
    {
      filename: 'app.tsx',
      code: "import { css } from '@panda/css'\r\n// ünïcode\r\ncss({ color: '{colors.red.500}' })",
      output: "import { css } from '@panda/css'\r\n// ünïcode\r\ncss({ color: 'red.500' })",
      errors: [
        {
          message: reference('red.500'),
          line: 3,
          column: 14,
          endColumn: 32,
          suggestions: [
            {
              desc: "Use 'red.500'",
              output: "import { css } from '@panda/css'\r\n// ünïcode\r\ncss({ color: 'red.500' })",
            },
          ],
        },
      ],
    },
    fixed(withCss("css({ color: 'token(colors.red.500)' })"), 'red.500', withCss("css({ color: 'red.500' })")),
    fixed(withCss("css({ color: '{colors.red.500}' })"), 'red.500', withCss("css({ color: 'red.500' })")),
    fixed(withCss("css({ padding: 'token(spacing.4)' })"), '4', withCss("css({ padding: '4' })")),
    fixed(withCss("css({ p: '{spacing.4}' })"), '4', withCss("css({ p: '4' })")),
    fixed(withCss("css({ width: '[{sizes.4}]' })"), '4', withCss("css({ width: '4' })")),
    fixed(withCss("css({ color: ' {colors.red.500} ' })"), 'red.500', withCss("css({ color: 'red.500' })")),
    fixed(withCss('css({ color: `{colors.red.500}` })'), 'red.500', withCss('css({ color: `red.500` })')),
    fixed(withCss("css({ color: '{colors.red.500/50}' })"), 'red.500/50', withCss("css({ color: 'red.500/50' })")),
    fixed(withCss("css({ color: '{colors.fg}' })"), 'fg', withCss("css({ color: 'fg' })")),
    fixed(withCss("css({ color: '{colors.accent}' })"), 'accent', withCss("css({ color: 'accent' })")),
    fixed(
      withCss("css({ _hover: { color: '{colors.red.500}' } })"),
      'red.500',
      withCss("css({ _hover: { color: 'red.500' } })"),
    ),
    fixed(
      withJsx('const a = <styled.div color="{colors.red.500}" />'),
      'red.500',
      withJsx('const a = <styled.div color="red.500" />'),
    ),
    fixed(
      withJsx("const a = <styled.div color={'token(colors.red.500)'} />"),
      'red.500',
      withJsx('const a = <styled.div color="red.500" />'),
    ),

    suggested(
      withToken("css({ color: token('colors.red.500') })"),
      call('red.500'),
      'red.500',
      withToken("css({ color: 'red.500' })"),
    ),
    suggested(withToken("css({ padding: token('spacing.4') })"), call('4'), '4', withToken("css({ padding: '4' })")),
    suggested(
      withToken("css({ marginBottom: token('sizes.page') })"),
      call('{sizes.page}'),
      '{sizes.page}',
      withToken("css({ marginBottom: '{sizes.page}' })"),
    ),
    suggested(
      withToken("css({ color: token.var('colors.red.500') })"),
      "token.var() isn't needed in a style value. Use 'red.500'.",
      'red.500',
      withToken("css({ color: 'red.500' })"),
    ),
    suggested(
      withJsx("const a = <styled.div color={token('colors.red.500')} />"),
      call('red.500'),
      'red.500',
      withJsx('const a = <styled.div color="red.500" />'),
    ),

    {
      filename: 'app.tsx',
      code: withCss("css({ color: { base: '{colors.red.500}', md: 'token(colors.fg)' } })"),
      output: withCss("css({ color: { base: 'red.500', md: 'fg' } })"),
      errors: [
        {
          message: reference('red.500'),
          line: 2,
          column: 22,
          endColumn: 40,
          suggestions: [
            { desc: "Use 'red.500'", output: withCss("css({ color: { base: 'red.500', md: 'token(colors.fg)' } })") },
          ],
        },
        {
          message: reference('fg'),
          line: 2,
          column: 46,
          endColumn: 64,
          suggestions: [
            { desc: "Use 'fg'", output: withCss("css({ color: { base: '{colors.red.500}', md: 'fg' } })") },
          ],
        },
      ],
    },
    {
      filename: 'app.tsx',
      code: withCss("css({ color: ['{colors.red.500}', 'red.500'] })"),
      output: withCss("css({ color: ['red.500', 'red.500'] })"),
      errors: [
        {
          message: reference('red.500'),
          line: 2,
          column: 15,
          endColumn: 33,
          suggestions: [{ desc: "Use 'red.500'", output: withCss("css({ color: ['red.500', 'red.500'] })") }],
        },
      ],
    },
  ],
})
