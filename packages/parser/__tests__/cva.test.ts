import { describe, expect, test } from 'vitest'
import { cvaParser } from './fixture'

describe('ast parser / cva', () => {
  test('should parse', () => {
    const code = `
    import {cva} from ".panda/css"

    const baseStyle = cva({
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

    expect(cvaParser(code)).toMatchInlineSnapshot(`
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
            "name": "cva",
            "type": "object",
          },
        },
      }
    `)
  })
})
