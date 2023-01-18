import { describe, expect, test } from 'vitest'
import { styledParser } from './fixture'

describe('ast parser / styled', () => {
  test('should parse', () => {
    const code = `
    import {panda} from ".panda/jsx"

    const baseStyle = panda("div", {
        base: {
            color: 'red',
            fontSize: '12px',
        },
        variants: {
            color: {
                red: {
                    background: 'red'
                }
            }
        }
    })
     `

    expect(styledParser(code)).toMatchInlineSnapshot(`
      {
        "cva": Set {
          {
            "data": {
              "base": {
                "color": "red",
                "fontSize": "12px",
              },
              "variants": {
                "color": {
                  "red": {
                    "background": "red",
                  },
                },
              },
            },
            "name": "panda",
            "type": "cva",
          },
        },
      }
    `)
  })
})
