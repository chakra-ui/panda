import { describe, test, expect } from 'vitest'
import { patternParser } from './fixture'

describe('pattern jsx', () => {
  test('should extract', () => {
    const code = `
       import { stack, hstack as aliased } from ".panda/patterns"

       function Button() {
         return (
            <div>
               <div className={stack({ align: "center" })}>Click me</div>
               <div className={aliased({ justify: "flex-end" })}>Click me</div>
            </div>
        )
       }
     `

    expect(patternParser(code)).toMatchInlineSnapshot(`
      Map {
        "stack" => Set {
          {
            "box": {
              "node": "CallExpression",
              "stack": [
                "CallExpression",
                "ObjectLiteralExpression",
              ],
              "type": "map",
              "value": Map {
                "align" => {
                  "node": "StringLiteral",
                  "stack": [
                    "CallExpression",
                    "ObjectLiteralExpression",
                    "PropertyAssignment",
                    "StringLiteral",
                  ],
                  "type": "literal",
                  "value": "center",
                },
              },
            },
            "data": [
              {
                "align": "center",
              },
            ],
            "name": "stack",
            "type": "pattern",
          },
        },
        "hstack" => Set {
          {
            "box": {
              "node": "CallExpression",
              "stack": [
                "CallExpression",
                "ObjectLiteralExpression",
              ],
              "type": "map",
              "value": Map {
                "justify" => {
                  "node": "StringLiteral",
                  "stack": [
                    "CallExpression",
                    "ObjectLiteralExpression",
                    "PropertyAssignment",
                    "StringLiteral",
                  ],
                  "type": "literal",
                  "value": "flex-end",
                },
              },
            },
            "data": [
              {
                "justify": "flex-end",
              },
            ],
            "name": "hstack",
            "type": "pattern",
          },
        },
      }
    `)
  })
})
