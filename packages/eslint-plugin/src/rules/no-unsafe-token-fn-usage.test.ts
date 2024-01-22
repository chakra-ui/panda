import { tester } from '../../test-utils'
import rule, { RULE_NAME } from './no-unsafe-token-fn-usage'

const imports = `import { css } from './panda/css';
import { Circle } from './panda/jsx';
import { tokens as tk } from './panda/tokens';
`

const valids = [
  'const styles = css({ bg: "token(colors.red.300) 50%" })',
  '<div className={css({ border: "solid {borderWidths.1} blue" })} />',
]

const invalids = [
  { code: 'const styles = css({ bg: tk("colors.red.300") })', output: 'const styles = css({ bg: "red.300" })' },
  { code: 'const styles = css({ bg: tk(`colors.red.300`) })', output: 'const styles = css({ bg: "red.300" })' },
  { code: 'const styles = css({ bg: "token(colors.red.300)" })', output: 'const styles = css({ bg: "red.300" })' },
  { code: '<div className={css({ border: "{borders.1}" })} />', output: '<div className={css({ border: "1" })} />' },
  { code: '<Circle _hover={{ color: "{colors.blue.300}" }} />', output: '<Circle _hover={{ color: "blue.300" }} />' },
  { code: '<Circle bg={tk("colors.red.300")} />', output: '<Circle bg={"red.300"} />' },
  { code: '<Circle bg={"token(colors.red.300)"} />', output: '<Circle bg={"red.300"} />' },
  { code: '<Circle bg="token(colors.red.300)" />', output: '<Circle bg="red.300" />' },
  { code: '<Circle bg={`token(colors.red.300)`} />', output: '<Circle bg={"red.300"} />' },
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
        messageId: 'noUnsafeTokenFnUsage',
        suggestions: null,
      },
    ],
    output: imports + output,
  })),
})
