import { describe, expect, it } from 'vitest'
import { createProject } from './test-utils'

// The runtime picks a branch or merges last-wins, so static CSS must cover every atom that might apply.
function compile(source: string) {
  const compiler = createProject({
    utilities: { margin: { className: 'm' }, padding: { className: 'p' } },
  })
  compiler.parseFileSource('app.tsx', `import { css } from '@panda/css'\n${source}`)
  return compiler.getLayerCss({ layers: ['utilities'] }).css
}

describe('conditional / multi-arg union extraction', () => {
  it('emits every css() argument (last-wins merge)', () => {
    expect(compile("css({ margin: '1' }, { margin: '2' }, { margin: '3' }, { margin: '4' })")).toMatchInlineSnapshot(`
      "@layer utilities {
        .m_1 {
          margin: 1px;
        }
        .m_2 {
          margin: 2px;
        }
        .m_3 {
          margin: 3px;
        }
        .m_4 {
          margin: 4px;
        }
      }
      "
    `)
  })

  it('treats a top-level array arg as a merge-list (skips falsy entries)', () => {
    expect(compile("css([{ margin: '1' }, { margin: '3' }, false])")).toMatchInlineSnapshot(`
        "@layer utilities {
          .m_1 {
            margin: 1px;
          }
          .m_3 {
            margin: 3px;
          }
        }
        "
      `)
  })

  it('expands a value-level ternary into both branches', () => {
    expect(compile("export function C(props){ return css({ margin: props.cond ? '3' : '5' }) }"))
      .toMatchInlineSnapshot(`
      "@layer utilities {
        .m_3 {
          margin: 3px;
        }
        .m_5 {
          margin: 5px;
        }
      }
      "
    `)
  })

  it('emits the right operand of a value-level && / ?? ', () => {
    expect(compile("export function C(props){ return css({ margin: props.cond && '3' }) }")).toMatchInlineSnapshot(`
      "@layer utilities {
        .m_3 {
          margin: 3px;
        }
      }
      "
    `)
  })

  it('keeps an array nested in an arg-level ternary a merge-list (not responsive)', () => {
    expect(compile("export function C(p){ return css(p.cond ? [{ margin: '1' }, { margin: '3' }] : { margin: '5' }) }"))
      .toMatchInlineSnapshot(`
      "@layer utilities {
        .m_1 {
          margin: 1px;
        }
        .m_3 {
          margin: 3px;
        }
        .m_5 {
          margin: 5px;
        }
      }
      "
    `)
  })

  it('emits every branch of a conditional spread (...(cond ? a : b))', () => {
    expect(
      compile("export function C(p){ return css({ margin: '1', ...(p.cond ? { padding: '2' } : { padding: '3' }) }) }"),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
        .m_1 {
          margin: 1px;
        }
        .p_2 {
          padding: 2px;
        }
        .p_3 {
          padding: 3px;
        }
      }
      "
    `)
  })

  it('emits the right operand of a conditional && spread', () => {
    expect(compile("export function C(p){ return css({ margin: '1', ...(p.cond && { padding: '2' }) }) }"))
      .toMatchInlineSnapshot(`
      "@layer utilities {
        .m_1 {
          margin: 1px;
        }
        .p_2 {
          padding: 2px;
        }
      }
      "
    `)
  })

  it('expands an arg-level && and merges with prior args', () => {
    expect(compile("export function C(props){ return css({ margin: '1' }, props.cond && { margin: '3' }) }"))
      .toMatchInlineSnapshot(`
      "@layer utilities {
        .m_1 {
          margin: 1px;
        }
        .m_3 {
          margin: 3px;
        }
      }
      "
    `)
  })
})
