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

describe('compiler.layerCss()', () => {
  it('returns only the tokens layer (vars + keyframes)', () => {
    expect(build().layerCss(['tokens'])).toMatchInlineSnapshot(`
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
    expect(build().layerCss(['utilities'])).toMatchInlineSnapshot(`
      "@layer utilities {
        .c_red {
          color: #f00;
        }
      }
      "
    `)
  })

  it('concatenates layers in the requested order', () => {
    expect(build().layerCss(['utilities', 'tokens'])).toMatchInlineSnapshot(`
      "@layer utilities {
        .c_red {
          color: #f00;
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
    expect(build().layerCss([])).toBe('')
    expect(build().layerCss(['nope' as never])).toBe('')
  })

  it('is a subset of the full compiled css', () => {
    const compiler = build()
    const full = compiler.compile().css
    expect(full.includes(compiler.layerCss(['utilities']).trim())).toBe(true)
  })
})
