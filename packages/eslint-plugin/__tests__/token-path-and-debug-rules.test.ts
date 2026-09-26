import { createPandaRuleTester } from './panda-rule-tester'

const ruleTester = await createPandaRuleTester(`export default {
  outdir: 'styled-system',
  importMap: {
    css: ['@panda/css'],
    tokens: ['@panda/tokens'],
  },
  theme: {
    tokens: {
      colors: {
        red: { 500: { value: '#f00' } },
      },
    },
  },
  utilities: {
    color: { className: 'c', values: 'colors' },
  },
}`)

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
