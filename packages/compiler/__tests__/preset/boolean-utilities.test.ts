import { describe, expect, it } from 'vitest'
import { createPresetCompiler } from '../preset-compiler'

function utilitiesCss(source: string) {
  const compiler = createPresetCompiler()
  compiler.parseFileSource('/virtual/T.tsx', `import { css } from '@panda/css'\n${source}`)
  return compiler.getLayerCss({ layers: ['utilities'] }).css
}

describe('preset boolean utilities', () => {
  it('shows a screen-reader-only element again from a breakpoint up', () => {
    expect(utilitiesCss(`css({ srOnly: true, md: { srOnly: false } })`)).toMatchInlineSnapshot(`
      "@layer utilities {
        .sr_true {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }
        @media (width >= 48rem) {
          .md\\:sr_false {
            position: static;
            width: auto;
            height: auto;
            padding: 0;
            margin: 0;
            overflow: visible;
            clip: auto;
            white-space: normal;
          }
        }
      }
      "
    `)
  })

  it('emits the false value of srOnly outside a condition', () => {
    expect(utilitiesCss(`css({ srOnly: false })`)).toMatchInlineSnapshot(`
      "@layer utilities {
        .sr_false {
          position: static;
          width: auto;
          height: auto;
          padding: 0;
          margin: 0;
          overflow: visible;
          clip: auto;
          white-space: normal;
        }
      }
      "
    `)
  })
})
