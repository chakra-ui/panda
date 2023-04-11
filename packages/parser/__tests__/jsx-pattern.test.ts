import { describe, test, expect } from 'vitest'
import { jsxPatternParser } from './fixture'

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

    expect(jsxPatternParser(code)).toMatchInlineSnapshot(`
      Set {
        {
          "box": BoxNodeMap {
            "node": JsxOpeningElement,
            "spreadConditions": undefined,
            "stack": [],
            "type": "map",
            "value": Map {
              "align" => BoxNodeLiteral {
                "kind": "string",
                "node": StringLiteral,
                "stack": [
                  JsxAttribute,
                  StringLiteral,
                ],
                "type": "literal",
                "value": "center",
              },
              "marginTop" => BoxNodeLiteral {
                "kind": "string",
                "node": StringLiteral,
                "stack": [
                  JsxAttribute,
                  StringLiteral,
                ],
                "type": "literal",
                "value": "40px",
              },
              "marginBottom" => BoxNodeLiteral {
                "kind": "string",
                "node": StringLiteral,
                "stack": [
                  JsxAttribute,
                  StringLiteral,
                ],
                "type": "literal",
                "value": "42px",
              },
            },
          },
          "data": {
            "conditions": [],
            "raw": {
              "align": "center",
              "marginBottom": "42px",
              "marginTop": "40px",
            },
            "spreadConditions": [],
          },
          "name": "Stack",
          "type": "pattern",
        },
      }
    `)
  })
})
