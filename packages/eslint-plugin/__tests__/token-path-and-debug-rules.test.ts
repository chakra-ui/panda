import { createPandaRuleTester, withCss } from './panda-rule-tester'

const ruleTester = await createPandaRuleTester(`export default {
  outdir: 'styled-system',
  jsxFramework: 'react',
  importMap: {
    css: ['@panda/css'],
    tokens: ['@panda/tokens'],
    jsx: ['@panda/jsx'],
    patterns: ['@panda/patterns'],
  },
  conditions: { hover: '&:hover' },
  theme: {
    tokens: {
      colors: {
        red: { 500: { value: '#f00' } },
      },
      sizes: {
        4: { value: '1rem' },
      },
    },
  },
  patterns: {
    stack: {
      properties: { gap: { type: 'property', value: 'gap' } },
      transform: (props) => ({ display: 'flex', ...props }),
    },
  },
  utilities: {
    color: { className: 'c', values: 'colors' },
  },
}`)

const notFound = (token: string) => ({ message: `Panda token "${token}" was not found.` })

ruleTester.run('no-invalid-token-paths', {
  valid: [
    {
      filename: 'app.tsx',
      code: [
        "import { css } from '@panda/css'",
        "import { token } from '@panda/tokens'",
        "css({ color: token('colors.red.500') })",
      ].join('\n'),
    },
    {
      filename: 'app.tsx',
      code: withCss(
        'css({',
        "  boxShadow: '0 0 0 1px {colors.red.500}',",
        "  width: 'calc(token(sizes.4) + 2px)',",
        "  outline: '1px solid token(colors.red.500, blue)',",
        "  color: '{colors.red.500/50}',",
        `  content: '"{ hello }"',`,
        "  backgroundImage: 'url(/img.v2.png)',",
        '})',
      ),
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
    {
      filename: 'app.tsx',
      code: withCss(
        'css({',
        "  boxShadow: '0 0 0 1px {colors.shadow}',",
        "  border: '1px solid token(colors.border)',",
        "  width: 'calc(token(sizes.width) + 2px)',",
        '})',
      ),
      errors: [
        { ...notFound('colors.shadow'), line: 3, column: 26, endLine: 3, endColumn: 39 },
        { ...notFound('colors.border'), line: 4, column: 28, endLine: 4, endColumn: 41 },
        { ...notFound('sizes.width'), line: 5, column: 22, endLine: 5, endColumn: 33 },
      ],
    },
    {
      filename: 'app.tsx',
      code: withCss(
        "const shadow = '0 0 0 1px {colors.fromVariable}'",
        'css({',
        "  outline: '1px solid token(colors.red.500, {colors.fallback})',",
        "  _hover: { color: '{colors.hover/50}' },",
        "  caretColor: ['{colors.array}', '{colors.red.500} {colors.second}'],",
        '  textShadow: shadow,',
        '  textDecorationColor: `{colors.template}`,',
        '})',
      ),
      errors: [
        notFound('colors.fallback'),
        notFound('colors.hover'),
        notFound('colors.array'),
        notFound('colors.second'),
        { ...notFound('colors.fromVariable'), line: 7, column: 15, endLine: 7, endColumn: 21 },
        notFound('colors.template'),
      ],
    },
    {
      filename: 'app.tsx',
      code: [
        "import { cva, sva } from '@panda/css'",
        "import { Box } from '@panda/jsx'",
        "cva({ base: { color: '{colors.cvaBase}' }, variants: { tone: { x: { color: '{colors.cvaVariant}' } } } })",
        "sva({ slots: ['root'], base: { root: { color: '{colors.slot}' } } })",
        "const J = () => <Box boxShadow='0 0 0 1px {colors.jsx}' css={{ color: '{colors.cssProp}' }} />",
      ].join('\n'),
      errors: [
        notFound('colors.cvaBase'),
        notFound('colors.cvaVariant'),
        notFound('colors.slot'),
        notFound('colors.jsx'),
        notFound('colors.cssProp'),
      ],
    },
    {
      filename: 'app.tsx',
      code: ["import { stack } from '@panda/patterns'", "stack({ gap: '{sizes.patternGap}' })"].join('\n'),
      errors: [{ ...notFound('sizes.patternGap'), line: 2, column: 16, endLine: 2, endColumn: 32 }],
    },
  ],
})

ruleTester.run('no-debug', {
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
