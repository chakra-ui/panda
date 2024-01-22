import { getArbitraryValue } from '@pandacss/shared'
import { tester } from '../../test-utils'
import rule, { RULE_NAME } from './no-escape-hatch'

const imports = `import { css } from './panda/css'
import { Circle } from './panda/jsx'
`

const namedGridLines = `
[
  [full-start]
    minmax(16px, 1fr)
      [breakout-start]
        minmax(0, 16px)
          [content-start]
            minmax(min-content, 1024px)
          [content-end]
        minmax(0, 16px)
      [breakout-end]
    minmax(16px, 1fr)
  [full-end]
]
`

const valids = [
  'const styles = css({ marginLeft: "4" })',
  `const layout = css({
      display: "grid",
      gridTemplateColumns: \`${getArbitraryValue(namedGridLines)}\`,
    });
    `,
  '<div className={css({ background: "red.100" })} />',
  '<Circle _hover={{ position: "absolute" }} />',
  `<Circle gridTemplateColumns={\`${getArbitraryValue(namedGridLines)}\`} />`,
]

const invalids = [
  { code: 'const styles = css({ marginLeft: "[4px]" })', output: 'const styles = css({ marginLeft: "4px" })' },
  {
    code: `const layout = css({
    display: "grid",
    gridTemplateColumns: \`${namedGridLines}\`,
  });
  `,
    output: `const layout = css({
    display: "grid",
    gridTemplateColumns: \`${getArbitraryValue(namedGridLines)}\`,
  });
  `,
  },
  {
    code: '<div className={css({ background: "[#111]" })} />',
    output: '<div className={css({ background: "#111" })} />',
  },
  { code: '<Circle _hover={{ position: "[absolute]" }} />', output: '<Circle _hover={{ position: "absolute" }} />' },
  {
    code: `<Circle gridTemplateColumns={\`${namedGridLines}\`} />`,
    output: `<Circle gridTemplateColumns={\`${getArbitraryValue(namedGridLines)}\`} />`,
  },
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
        messageId: 'escapeHatch',
        suggestions: null,
      },
    ],
    output: imports + output,
  })),
})
