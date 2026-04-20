import { describe, expect, test } from 'vitest'
import { parseAndExtract } from './fixture'

describe('ast parser / css prop', () => {
  test('should parse', () => {
    const code = `
    import { css } from "styled-system/css"

    const Test = ({ css: cssProp }) => {
      return <div className={css(cssProp)} />
    }

    const test = <Test css={{ bg: "red.200" }} />
     `

    const result = parseAndExtract(code)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .bg_red\\.200 {
          background: var(--colors-red-200);
      }
      }"
    `)
  })

  // Regression test for https://github.com/chakra-ui/panda/issues/3509
  // React's automatic JSX runtime compiles `<Test css={{ bg: 'red.200' }} />`
  // down to `jsx(Test, { css: { bg: 'red.200' } })`. Panda's extractor should
  // recognize the inline object literal passed to the `css` prop in that form
  // so that scanning compiled `dist` files of component libraries still produces CSS.
  test('should parse compiled jsx() call form with inline css object literal', () => {
    const code = `
    import { jsx } from "react/jsx-runtime"
    import { css, cx } from "styled-system/css"

    const Test = (props) => {
      const { css: cssProp, children } = props
      return jsx("div", { className: cx(css(cssProp)), children })
    }

    const test = jsx(Test, { css: { bg: "red.200" } })
     `

    const result = parseAndExtract(code)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .bg_red\\.200 {
          background: var(--colors-red-200);
      }
      }"
    `)
  })
})
