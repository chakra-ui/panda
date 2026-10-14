import { describe, expect, it } from 'vitest'
import { createPresetCompiler } from './preset-compiler'

describe('jsxMatchTag', () => {
  it('reads RegExp rules from the config', () => {
    const compiler = createPresetCompiler({
      jsxFramework: 'react',
      jsxMatchTag: [
        { from: '@acme/ui', ignore: true },
        { tag: /Button$/, props: ['color'] },
      ],
    })
    compiler.parseFileSource(
      'app.tsx',
      [
        "import { Table } from '@acme/ui'",
        'const table = <Table color="red" />',
        'const button = <IconButton color="blue" padding="2" />',
      ].join('\n'),
    )

    const css = compiler.getLayerCss({ layers: ['utilities'] }).css
    expect(css).toContain('c_blue')
    expect(css).not.toContain('c_red')
    expect(css).not.toContain('p_2')
  })
})
