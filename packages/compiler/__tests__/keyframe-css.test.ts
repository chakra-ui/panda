import { describe, expect, it } from 'vitest'
import { createProject } from './test-utils'

function build() {
  const compiler = createProject({
    theme: {
      tokens: { colors: { red: { value: '#f00' } } },
      keyframes: { spin: { from: { opacity: '0' }, to: { opacity: '1' } } },
    },
    utilities: { color: { className: 'c', values: 'colors' } },
  })
  compiler.parseFileSource('app.tsx', "import { css } from '@panda/css'\ncss({ color: 'red' })")
  return compiler
}

describe('compiler.getKeyframeCss()', () => {
  it('returns keyframes wrapped in the tokens layer by default', () => {
    expect(build().getKeyframeCss().css).toMatchInlineSnapshot(`
      "@layer tokens {
        @keyframes spin {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      }
      "
    `)
  })

  it('omits token CSS variables', () => {
    const css = build().getKeyframeCss().css
    expect(css).not.toContain('--colors-red')
    expect(css).not.toContain('.c_red')
  })

  it('emits bare keyframes when emitLayerDeclaration is false', () => {
    expect(build().getKeyframeCss({ emitLayerDeclaration: false }).css).toMatchInlineSnapshot(`
      "@keyframes spin {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      "
    `)
  })

  it('returns empty when no keyframes are defined', () => {
    const compiler = createProject({
      theme: { tokens: { colors: { red: { value: '#f00' } } } },
    })
    expect(compiler.getKeyframeCss().css).toBe('')
  })
})
