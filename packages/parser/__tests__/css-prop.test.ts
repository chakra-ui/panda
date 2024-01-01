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
        .bg_red\\\\.200 {
          background: var(--colors-red-200)
      }
      }"
    `)
  })
})
