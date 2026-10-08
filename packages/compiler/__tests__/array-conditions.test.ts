import { describe, expect, it } from 'vitest'
import { createProject, lines } from './test-utils'

function cssFor(conditions: Record<string, unknown>, style: string) {
  const compiler = createProject({ conditions, utilities: { color: {} } })
  compiler.parseFileSource('app.tsx', lines("import { css } from '@panda/css'", `css(${style})`))
  return compiler.getLayerCss({ layers: ['utilities'] }).css
}

describe('v1 array conditions', () => {
  it('emit the same css as the block form', () => {
    const fromArray = cssFor({ hoverFine: ['@media (hover: hover)', '&:hover'] }, "{ _hoverFine: { color: 'red' } }")
    const fromBlock = cssFor(
      { hoverFine: { '@media (hover: hover)': { '&:hover': '@slot' } } },
      "{ _hoverFine: { color: 'red' } }",
    )

    expect(fromArray).toBe(fromBlock)
    expect(fromArray).toMatchInlineSnapshot(`
      "@layer utilities {
        @media (hover: hover) {
          .hoverFine\\:color_red:hover {
            color: red;
          }
        }
      }
      "
    `)
  })

  it('keep pseudo-elements last', () => {
    expect(cssFor({ beforeHover: ['&::before', '&:hover'] }, "{ _beforeHover: { color: 'red' } }"))
      .toMatchInlineSnapshot(`
      "@layer utilities {
        .beforeHover\\:color_red:hover::before {
          color: red;
        }
      }
      "
    `)
  })
})
