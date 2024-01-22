import { tester } from '../../test-utils'
import rule, { RULE_NAME } from './no-shorthand-prop'

const imports = `import { css } from './panda/css'
import { Circle } from './panda/jsx'
`

const valids = [
  'const styles = css({ marginLeft: "4" })',
  '<div className={css({ background: "red.100" })} />',
  '<Circle _hover={{ position: "absolute" }} />',
]

const invalids = [
  { code: 'const styles = css({ ml: "4" })', output: 'const styles = css({ marginLeft: "4" })' },
  { code: '<div className={css({ bg: "red.100" })} />', output: '<div className={css({ background: "red.100" })} />' },
  { code: '<Circle _hover={{ pos: "absolute" }} />', output: '<Circle _hover={{ position: "absolute" }} />' },
]

tester.run(RULE_NAME, rule as any, {
  valid: valids.map((code) => ({
    code: imports + code,
    filename: './src/valid.tsx',
  })),
  invalid: invalids.map(({ code, output }) => ({
    code: imports + code,
    filename: './src/invalid.tsx',
    errors: [
      {
        messageId: 'longhand',
        suggestions: null,
      },
    ],
    output: imports + output,
  })),
})
