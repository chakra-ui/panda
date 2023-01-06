import { describe, test, expect } from 'vitest'
import { cssParser } from './fixture'

describe('ast parser', () => {
  test('[without import] should not parse', () => {
    const code = `
        const baseStyle = css({
            color: 'red',
            fontSize: '12px',
        })

        const testStyle = css({
          bg: "red.300",
          margin: { xs: "0", lg:"40px" },
          padding: [12, 50]
        })
     `

    expect(cssParser(code)).toMatchInlineSnapshot(`
      {
        "css": Set {},
        "cssMap": Set {},
      }
    `)
  })

  test('[with import] should parse static property', () => {
    const code = `
    import {css} from ".panda/css";
        const baseStyle = css({
            color: 'red',
            fontSize: '12px',
        })

        const testStyle = css({
          bg: "red.300",
          margin: { xs: "0", lg:"40px" },
          padding: [12, 50]
        })
     `

    expect(cssParser(code)).toMatchInlineSnapshot(`
      {
        "css": Set {
          {
            "data": {
              "color": "red",
              "fontSize": "12px",
            },
            "name": "css",
            "type": "object",
          },
          {
            "data": {
              "bg": "red.300",
              "margin": {
                "lg": "40px",
                "xs": "0",
              },
              "padding": [
                12,
                50,
              ],
            },
            "name": "css",
            "type": "object",
          },
        },
        "cssMap": Set {},
      }
    `)
  })

  test('[with import alias] should parse static property', () => {
    const code = `
    import {css as nCss} from ".panda/css";
        const baseStyle = nCss({
            color: 'red',
            fontSize: '12px',
        })

        const testStyle = nCss({
          bg: "red.300",
          margin: { xs: "0", lg:"40px" },
          padding: [12, 50]
        })
     `

    expect(cssParser(code)).toMatchInlineSnapshot(`
      {
        "css": Set {
          {
            "data": {
              "color": "red",
              "fontSize": "12px",
            },
            "name": "css",
            "type": "object",
          },
          {
            "data": {
              "bg": "red.300",
              "margin": {
                "lg": "40px",
                "xs": "0",
              },
              "padding": [
                12,
                50,
              ],
            },
            "name": "css",
            "type": "object",
          },
        },
        "cssMap": Set {},
      }
    `)
  })

  test('should extract nested css', () => {
    const code = `
      import { css } from '.panda/css'

console.log(
  console.log(
    css({
      selectors: {
        '&:hover': {
          background: 'red.200',
        },
      },
    }),
  ),
)
`

    expect(cssParser(code)).toMatchInlineSnapshot(`
      {
        "css": Set {
          {
            "data": {
              "selectors": {
                "&:hover": {
                  "background": "red.200",
                },
              },
            },
            "name": "css",
            "type": "object",
          },
        },
        "cssMap": Set {},
      }
    `)
  })

  test('should extract complex setup', () => {
    const code = `
      import { css, cx } from '.panda/css'
import React from 'react'

export function Card({ className }) {
  return (
    <div className={cx('card', css({ background: 'white' }), className)}>
      <div></div>
    </div>
  )
}

      `
    expect(cssParser(code)).toMatchInlineSnapshot(`
      {
        "css": Set {
          {
            "data": {
              "background": "white",
            },
            "name": "css",
            "type": "object",
          },
        },
        "cssMap": Set {},
      }
    `)
  })
})
