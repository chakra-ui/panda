import { describe, test, expect } from 'vitest'
import { patternParser } from './fixture'

describe('pattern jsx', () => {
  test('should extract', () => {
    const code = `
       import { Stack } from "styled-system/jsx"

       function Button() {
         return (
            <div>
               <Stack as="a" align="center" marginTop="40px" marginBottom="42px" dir="rtl">Click me</Stack>
            </div>
        )
       }
     `

    expect(patternParser(code)).toMatchInlineSnapshot(`
      Map {
        "Stack" => Set {
          {
            "box": {
              "column": 16,
              "line": 7,
              "node": "JsxOpeningElement",
              "type": "map",
              "value": Map {
                "align" => {
                  "column": 36,
                  "line": 7,
                  "node": "StringLiteral",
                  "type": "literal",
                  "value": "center",
                },
                "marginTop" => {
                  "column": 55,
                  "line": 7,
                  "node": "StringLiteral",
                  "type": "literal",
                  "value": "40px",
                },
                "marginBottom" => {
                  "column": 75,
                  "line": 7,
                  "node": "StringLiteral",
                  "type": "literal",
                  "value": "42px",
                },
              },
            },
            "data": [
              {
                "align": "center",
                "marginBottom": "42px",
                "marginTop": "40px",
              },
            ],
            "name": "Stack",
            "type": "jsx-pattern",
          },
        },
      }
    `)
  })
})
