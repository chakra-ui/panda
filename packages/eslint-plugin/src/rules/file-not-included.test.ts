import { tester } from '../../test-utils'
import rule, { RULE_NAME } from './file-not-included'

const code = `import { css } from './panda/css'
import { Circle } from './panda/jsx'
`

tester.run(RULE_NAME, rule as any, {
  valid: [
    {
      code,
      filename: './src/valid.tsx',
    },
  ],
  invalid: [
    {
      code,
      filename: './src/invalid.tsx',
      errors: [
        {
          messageId: 'include',
          suggestions: null,
        },
        {
          messageId: 'include',
          suggestions: null,
        },
      ],
    },
  ],
})
