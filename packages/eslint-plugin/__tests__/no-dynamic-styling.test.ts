import { createPandaRuleTester, withCss } from './panda-rule-tester'

const ruleTester = await createPandaRuleTester(`export default {
  outdir: 'styled-system',
  jsxFramework: 'react',
  importMap: { css: ['@panda/css'], jsx: ['@panda/jsx'], recipes: ['@panda/recipes'], tokens: ['@panda/tokens'] },
  theme: {
    recipes: {
      button: { className: 'button', jsx: ['Button'], variants: { size: { sm: { color: 'red' } } } },
    },
  },
}`)

const withJsx = (...lines: string[]) => ["import { Button, styled } from '@panda/jsx'", ...lines].join('\n')

ruleTester.run('no-dynamic-styling', {
  valid: [
    { filename: 'app.tsx', code: withCss("css({ color: 'red', _hover: { color: 'blue' } })") },
    { filename: 'app.tsx', code: withCss("const brand = 'red'", 'css({ color: brand })') },
    { filename: 'app.tsx', code: withCss("css({ color: active ? 'red' : 'blue' })") },
    { filename: 'app.tsx', code: withCss("css({ ...props, color: 'red' })") },
    { filename: 'app.tsx', code: "import { button } from '@panda/recipes'\nbutton({ size })" },
    { filename: 'app.tsx', code: "import { token } from '@panda/tokens'\ntoken(path)" },
    { filename: 'app.tsx', code: withJsx('const a = <Button size={size} />') },
    { filename: 'app.tsx', code: "import { Icon } from 'icons'\nconst a = <Icon color={tone} />" },
  ],
  invalid: [
    {
      filename: 'app.tsx',
      code: withCss("css({ color: tone, p: ['2', size] })"),
      errors: [
        {
          message: "Panda can't read this value at build time, so it generates no CSS for it.",
          line: 2,
          column: 14,
          endColumn: 18,
        },
        { messageId: 'value', line: 2, column: 29, endColumn: 33 },
      ],
    },
    {
      filename: 'app.tsx',
      code: withCss("css({ color: tone || 'red' })"),
      errors: [
        {
          message: "Panda can't read this value at build time, so it only generates CSS for the fallback.",
          column: 14,
          endColumn: 27,
        },
      ],
    },
    {
      filename: 'app.tsx',
      code: withCss("css({ [property]: 'red' })"),
      errors: [{ message: "Panda can't read this property name at build time, so it generates no CSS for it." }],
    },
    {
      filename: 'app.tsx',
      code: withCss('css(styles)'),
      errors: [{ message: "Panda can't read this argument at build time, so it generates no CSS for it." }],
    },
    {
      filename: 'app.tsx',
      code: withJsx('const a = <styled.div color={tone} css={{ bg: surface }} />'),
      errors: [
        { messageId: 'value', line: 2 },
        { messageId: 'value', line: 2 },
      ],
    },
  ],
})

const noJsxTester = await createPandaRuleTester(`export default {
  outdir: 'styled-system',
  importMap: { css: ['@panda/css'] },
}`)

noJsxTester.run('no-dynamic-styling', {
  valid: [],
  invalid: [{ filename: 'app.tsx', code: withCss('css(styles)'), errors: [{ messageId: 'argument' }] }],
})

noJsxTester.run('extraction-diagnostics', {
  valid: [{ filename: 'app.tsx', code: withCss('css(styles)') }],
  invalid: [],
})

const patternsTester = await createPandaRuleTester(`export default {
  outdir: 'styled-system',
  jsxFramework: 'react',
  importMap: { css: ['@panda/css'], jsx: ['@panda/jsx'], patterns: ['@panda/patterns'] },
  theme: { tokens: { colors: { red: { 500: { value: '#ef4444' } }, blue: { 500: { value: '#3b82f6' } } } } },
  patterns: {
    center: { transform: () => ({ display: 'flex', alignItems: 'center' }) },
  },
  staticCss: { css: [{ properties: { colorPalette: ['*'], display: ['block', 'none'] } }] },
}`)

const withPatterns = (...lines: string[]) =>
  [
    "import { css, cva } from '@panda/css'",
    "import { styled } from '@panda/jsx'",
    "import { center } from '@panda/patterns'",
    ...lines,
  ].join('\n')

patternsTester.run('no-dynamic-styling', {
  valid: [
    { filename: 'app.tsx', code: withPatterns('css(center.raw())') },
    { filename: 'app.tsx', code: withPatterns('cva({ base: center.raw() })') },
    { filename: 'app.tsx', code: withPatterns("styled('a', { base: center.raw() })") },
    {
      filename: 'app.tsx',
      code: withPatterns('const a = <styled.span colorPalette={palette} color="colorPalette.500" />'),
    },
  ],
  invalid: [
    { filename: 'app.tsx', code: withPatterns('css(getStyles())'), errors: [{ messageId: 'argument' }] },
    {
      filename: 'app.tsx',
      code: withPatterns('const a = <styled.span display={shown} />'),
      errors: [{ messageId: 'value' }],
    },
    {
      filename: 'app.tsx',
      code: withPatterns('css({ _hover: { colorPalette: palette } })'),
      errors: [{ messageId: 'value' }],
    },
  ],
})
