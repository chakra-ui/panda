import { describe, expect, test } from 'vitest'
import { astish } from '../src/astish'

describe('astish', () => {
  test('should work', () => {
    const result = astish(`
        display: flex;
        align-items: center;
        -webkit-align-items: center;
        @media (min-width: 400){
        color: red;
        justify-content: center;
        }
        @container (min-inline-width: 600px){
        background: pink;
        }
`)

    expect(result).toMatchInlineSnapshot(`
      {
        "-webkit-align-items": "center",
        "@container (min-inline-width: 600px)": {
          "background": "pink",
        },
        "@media (min-width: 400)": {
          "color": "red",
          "justify-content": "center",
        },
        "align-items": "center",
        "display": "flex",
      }
    `)
  })
})
