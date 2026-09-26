import { join } from 'node:path'
import { createPandaRuleTester } from './panda-rule-tester'

// Only files matched by `include` are extracted, so a Panda file outside it
// silently produces no CSS — which is what this rule flags.
const ruleTester = await createPandaRuleTester(`export default {
  outdir: 'styled-system',
  include: ['src/**/*.{ts,tsx}'],
  importMap: { css: ['@panda/css'] },
  theme: { tokens: { colors: { red: { 500: { value: '#f00' } } } } },
  utilities: { color: { className: 'c', values: 'colors' } },
}`)

const code = ["import { css } from '@panda/css'", "css({ color: 'red.500' })"].join('\n')

ruleTester.run('file-not-included', {
  valid: [
    // Inside `include` — extracted normally.
    { filename: join(ruleTester.dir, 'src/app.tsx'), code },
    // Outside `include` but no Panda usage — nothing to warn about.
    {
      filename: join(ruleTester.dir, 'scripts/build.tsx'),
      code: 'export const noop = () => {}',
    },
  ],
  invalid: [
    // Uses Panda but lives outside `include`: its styles won't be generated.
    {
      filename: join(ruleTester.dir, 'scripts/widget.tsx'),
      code,
      errors: [
        {
          message:
            'This file uses Panda but is not part of the Panda config `include` globs, so its styles will not be generated.',
        },
      ],
    },
  ],
})
