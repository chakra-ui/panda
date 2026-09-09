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

// The style prop's value never renders, so a rule for it would be dead CSS.
describe('css prop merging', () => {
  it('emits only the winning declaration', () => {
    const compiler = createProject({
      jsxFramework: 'react',
      utilities: { color: {} },
    })
    compiler.parseFileSource(
      'app.tsx',
      "import { Box } from '@panda/jsx'\nconst el = <Box color=\"red\" css={{ color: 'blue' }} />",
    )

    const css = compiler.getLayerCss({ layers: ['utilities'] }).css
    expect(css).toContain('color_blue')
    expect(css).not.toContain('color_red')
  })

  it('emits only the winning declaration when a shorthand and its longhand collide', () => {
    const compiler = createProject({
      jsxFramework: 'react',
      shorthands: true,
      utilities: { padding: { className: 'p', shorthand: 'p' } },
    })
    compiler.parseFileSource(
      'app.tsx',
      "import { Box } from '@panda/jsx'\nconst el = <Box padding=\"4\" css={{ p: '8' }} />",
    )

    const css = compiler.getLayerCss({ layers: ['utilities'] }).css
    expect(css).toContain('p_8')
    expect(css).not.toContain('p_4')
  })
})

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
