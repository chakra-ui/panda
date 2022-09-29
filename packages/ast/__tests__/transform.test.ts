import { importMap } from '@css-panda/fixture'
import { describe, expect, test } from 'vitest'
import { createCollector } from '../src/collector'
import { createPlugins } from '../src/plugins'
import { parseSync } from '../src/transform'

describe('ast parser', () => {
  test('[without import] should not parse', () => {
    const code = `
    import {css, globalCss, fontFace} from ".panda/css"

    globalCss({
        html: {
            fontSize: '12px',
        }
    })

    fontFace("Inter", {
        fontFamily: "Inter",
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

    const data = createCollector()

    parseSync(code, createPlugins({ data, importMap }))

    expect(data).toMatchInlineSnapshot(`
      {
        "css": Set {
          {
            "data": {
              "color": "red",
              "fontSize": "12px",
            },
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
            "type": "object",
          },
        },
        "cssMap": Set {},
        "fontFace": Set {
          {
            "data": {
              "fontFamily": "Inter",
            },
            "name": "Inter",
            "type": "named-object",
          },
        },
        "globalCss": Set {
          {
            "data": {
              "html": {
                "fontSize": "12px",
              },
            },
            "type": "object",
          },
        },
        "isEmpty": [Function],
        "jsx": Set {},
        "pattern": Map {},
        "recipe": Map {},
        "sx": Set {},
      }
    `)
  })
})
