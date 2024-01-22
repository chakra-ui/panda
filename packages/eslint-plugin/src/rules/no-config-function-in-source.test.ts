import { tester } from '../../test-utils'
import rule, { RULE_NAME } from './no-config-function-in-source'

const imports = `import { defineKeyframes } from '@pandacss/dev';`
const code = `const keyframes = defineKeyframes({
  fadeIn: {
    '0%': { opacity: '0' },
    '100%': { opacity: '1' },
  },
})
`

tester.run(RULE_NAME, rule as any, {
  valid: [
    {
      code: imports + code.trim(),
      filename: './panda.config.ts',
    },
  ],
  invalid: [
    {
      code: imports + code.trim(),
      filename: './src/valid.tsx',
      errors: [
        {
          messageId: 'configFunction',
          suggestions: null,
        },
      ],
      output: imports,
    },
  ],
})
