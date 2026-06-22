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

describe('compiler.getLayerCss()', () => {
  it('returns only the tokens layer (vars + keyframes)', () => {
    expect(build().getLayerCss({ layers: ['tokens'] }).css).toMatchInlineSnapshot(`
      "@layer tokens {
        :where(:root, :host) {
          --colors-red: #f00;
        }
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

  it('returns only the utilities layer', () => {
    expect(build().getLayerCss({ layers: ['utilities'] }).css).toMatchInlineSnapshot(`
      "@layer utilities {
        .c_red {
          color: var(--colors-red);
        }
      }
      "
    `)
  })

  it('concatenates layers in the requested order', () => {
    expect(build().getLayerCss({ layers: ['utilities', 'tokens'] }).css).toMatchInlineSnapshot(`
      "@layer utilities {
        .c_red {
          color: var(--colors-red);
        }
      }
      @layer tokens {
        :where(:root, :host) {
          --colors-red: #f00;
        }
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

  it('returns empty for unknown or empty layer lists', () => {
    expect(build().getLayerCss({ layers: [] }).css).toBe('')
    expect(build().getLayerCss({ layers: ['nope' as never] }).css).toBe('')
  })

  it('is a subset of the full compiled css', () => {
    const compiler = build()
    const full = compiler.compile().css
    expect(full.includes(compiler.getLayerCss({ layers: ['utilities'] }).css)).toBe(true)
  })
})
