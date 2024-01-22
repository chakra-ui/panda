import rule, { RULE_NAME } from './no-debug'
import { tester } from '../../test-utils'

const imports = `import { css } from './panda/css';
import { styled, Circle } from './panda/jsx';`

const valids = [
  'const styles = { debug: true }',
  'const styles = css({ bg: "red" })',
  'const styles = css.raw({ bg: "red" })',
  'const randomFunc = f({ debug: true })',
  '<NonPandaComponent debug={true} />',
  '<NonPandaComponent debug={true}>content</NonPandaComponent>',
  `const a = 1; const PandaComp = styled(div); <PandaComp someProp={{ debug: true }} />`,
]

const invalids = [
  { code: 'const styles = css({ bg: "red", debug: true })', output: 'const styles = css({ bg: "red", })' },
  {
    code: 'const styles = css.raw({ bg: "red", debug: true })',
    output: 'const styles = css.raw({ bg: "red", })',
  },
  {
    code: 'const styles = css({ bg: "red", "&:hover": { debug: true } })',
    output: 'const styles = css({ bg: "red", "&:hover": { } })',
  },
  {
    code: 'const styles = css({ bg: "red", "&:hover": { "&:disabled": { debug: true } } })',
    output: 'const styles = css({ bg: "red", "&:hover": { "&:disabled": { } } })',
  },
  { code: '<Circle debug />', output: '<Circle  />' },
  { code: '<Circle debug={true} />', output: '<Circle  />' },
  { code: '<Circle css={{ debug: true }} />', output: '<Circle css={{ }} />' },
  { code: '<Circle css={{ "&:hover": { debug: true } }} />', output: '<Circle css={{ "&:hover": { } }} />' },
  { code: '<styled.div _hover={{ debug: true }} />', output: '<styled.div _hover={{ }} />' },
  {
    code: `const PandaComp = styled(div); <PandaComp css={{ debug: true }} />`,
    output: 'const PandaComp = styled(div); <PandaComp css={{ }} />',
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
        messageId: 'debug',
        suggestions: null,
      },
    ],
    output: imports + output,
  })),
})
