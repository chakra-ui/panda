import { describe, expect, test } from 'vitest'
import { cssParser } from './fixture'

describe('ast parser', () => {
  test('[without import] should not parse', () => {
    const code = `
    import {css, globalCss} from ".panda/css"

    globalCss({
        html: {
            fontSize: '12px',
        }
    })

        const baseStyle = css({
            color: 'red',
            fontSize: '12px',
        })

        const testStyle = css({
          bg: "red.300",
          margin: { xs: "0", lg:"40px" },
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
            },
            "name": "css",
            "type": "object",
          },
        },
        "cssMap": Set {},
        "globalCss": Set {
          {
            "data": {
              "html": {
                "fontSize": "12px",
              },
            },
            "name": "globalCss",
            "type": "object",
          },
        },
      }
    `)
  })
})
