import { describe, test, expect } from 'vitest'
import { patternParser } from './fixture'

describe('pattern jsx', () => {
  test('should extract', () => {
    const code = `
       import { Stack } from ".panda/jsx"

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
              "node": "JsxOpeningElement",
              "stack": [],
              "type": "map",
              "value": Map {
                "align" => {
                  "node": "StringLiteral",
                  "stack": [
                    "JsxAttribute",
                    "StringLiteral",
                  ],
                  "type": "literal",
                  "value": "center",
                },
                "marginTop" => {
                  "node": "StringLiteral",
                  "stack": [
                    "JsxAttribute",
                    "StringLiteral",
                  ],
                  "type": "literal",
                  "value": "40px",
                },
                "marginBottom" => {
                  "node": "StringLiteral",
                  "stack": [
                    "JsxAttribute",
                    "StringLiteral",
                  ],
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
