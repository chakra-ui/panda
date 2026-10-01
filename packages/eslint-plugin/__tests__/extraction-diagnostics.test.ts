import { createPandaRuleTester, withCss } from './panda-rule-tester'

const ruleTester = await createPandaRuleTester(`export default {
  outdir: 'styled-system',
  jsxFramework: 'react',
  importMap: { css: ['@panda/css'], jsx: ['@panda/jsx'] },
  conditions: { hover: '&:hover', custom: '&[data-custom]' },
  theme: { breakpoints: { md: '768px' } },
  utilities: { color: { className: 'c', values: 'colors' } },
}`)

ruleTester.run('extraction-diagnostics', {
  valid: [
    {
      filename: 'app.tsx',
      code: withCss("css({ _hover: { color: 'red' }, _custom: { color: 'blue' }, md: { color: 'green' } })"),
    },
    { filename: 'app.tsx', code: "const x = { _hver: { color: 'red' } }" },
  ],
  invalid: [
    {
      filename: 'app.tsx',
      code: withCss("css({ _hver: { color: 'red', _hver: { color: 'blue' } } })"),
      errors: [{ message: 'unknown condition `_hver`, did you mean `_hover`?' }],
    },
    {
      filename: 'app.tsx',
      code: "import { cva } from '@panda/css'\ncva({ base: { _hver: { color: 'red' } } })",
      errors: [{ message: 'unknown condition `_hver`, did you mean `_hover`?' }],
    },
    {
      filename: 'app.tsx',
      code: withCss("css({ color: cond ? { _hver: 'red' } : { _hover: 'blue' } })"),
      errors: [{ message: 'unknown condition `_hver`, did you mean `_hover`?' }],
    },

    {
      filename: 'app.tsx',
      code: withCss("css({ _hver: { color: 'red.9' } })"),
      errors: [
        { message: 'unknown condition `_hver`, did you mean `_hover`?', line: 2, column: 1, endLine: 2, endColumn: 35 },
      ],
    },
    {
      filename: 'app.tsx',
      code: withCss("css({ color: { _hver: 'red.9' } })"),
      errors: [{ message: 'unknown condition `_hver`, did you mean `_hover`?' }],
    },
    {
      filename: 'app.tsx',
      code: "import { styled } from '@panda/jsx'\nconst x = <styled.div css={{ _hver: { color: 'red.9' } }} />",
      errors: [{ message: 'unknown condition `_hver`, did you mean `_hover`?' }],
    },
    {
      filename: 'app.tsx',
      code: withCss("css({ _zzzzz: { color: 'red' } })"),
      errors: [{ message: 'unknown condition `_zzzzz`' }],
    },
  ],
})
