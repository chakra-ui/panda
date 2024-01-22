import { tester } from '../../test-utils'
import rule, { RULE_NAME } from './no-invalid-token-paths'

const imports = `import { css } from './panda/css'
import { Circle } from './panda/jsx'
`

const valids = [
  `const styles = css({ bg: 'token(colors.red.300) 50%' })`,
  `const styles = css({ bg: 'token(colors.red.300, red) 50%' })`,
  '<div className={css({ marginX: "{sizes.4} {sizes.2}" })} />',
  `<Circle bg='token(colors.green.400) 40%' />`,
  `<Circle bg={\`token(colors.green.400) 40%\`} />`,
]

const invalids = [
  { code: `const styles = css({ bg: 'token(colors.red0.300) 50%' })`, errors: 1 },
  { code: `const styles = css({ bg: \`token(colors.red0.300) 50%\` })`, errors: 1 },
  { code: `const styles = css({ bg: 'token(colors.red.3004, red) 50%' })`, errors: 1 },
  { code: '<div className={css({ marginX: "{sizess.2} {sizes.200}" })} />', errors: 2 },
  { code: `<Circle bg='token(colorss.green.400) 40%' />`, errors: 1 },
]

tester.run(RULE_NAME, rule as any, {
  valid: valids.map((code) => ({
    code: imports + code,
    filename: './src/valid.tsx',
  })),
  invalid: invalids.map(({ code, errors }) => ({
    code: imports + code,
    filename: './src/invalid.tsx',
    errors: Array.from({ length: errors }).map(() => ({ messageId: 'noInvalidTokenPaths' })),
  })),
})
