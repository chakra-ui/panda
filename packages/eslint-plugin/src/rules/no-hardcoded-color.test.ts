import { tester } from '../../test-utils'
import rule, { RULE_NAME } from './no-hardcoded-color'

const imports = `import { css } from './panda/css'
import { Circle } from './panda/jsx'
`

// Watch out for color opacity in the future
const valids = [
  'const styles = css({ color: "red.100" })',
  '<div className={css({ background: "green.300" })} />',
  '<Circle _hover={{ borderColor: "gray.100" }} />',
  '<Circle _hover={{ bg: "gray.100" }} />',
  '<Circle _hover={{ bgColor: "gray.100" }} />',
]

const invalids = [
  'const styles = css({ color: "skyblue" })',
  '<div className={css({ background: "#111" })} />',
  '<Circle _hover={{ borderColor: "rgb(1, 1, 1)" }} />',
  '<Circle _hover={{ bg: "hsl(0deg, 0%, 7%)" }} />',
  '<Circle _hover={{ bgColor: "rgba(17, 17, 17, 1)" }} />',
]

tester.run(RULE_NAME, rule as any, {
  valid: valids.map((code) => ({
    code: imports + code,
    filename: './src/valid.tsx',
  })),
  invalid: invalids.map((code) => ({
    code: imports + code,
    filename: './src/invalid.tsx',
    errors: [
      {
        messageId: 'invalidColor',
        suggestions: null,
      },
    ],
  })),
})
