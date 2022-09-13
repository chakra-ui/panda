import { describe, test, expect } from 'vitest'
import { createCollector, createPlugins } from '../src/plugins'
import { transformSync } from '../src/transform'
import { importMap } from '@css-panda/fixture'

describe('ast parser', () => {
  test('[without import] should not parse', () => {
    const code = `
    import {css, globalStyle, fontFace} from ".panda/css"

    globalStyle({
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

    transformSync(code, {
      plugins: createPlugins({ data, importMap }),
    })

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
        "globalStyle": Set {
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
        "pattern": Map {},
        "recipe": Map {},
        "sx": Set {},
      }
    `)
  })
})
