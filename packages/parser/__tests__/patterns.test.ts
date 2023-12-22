import { describe, test, expect } from 'vitest'
import { patternParser } from './fixture'

describe('pattern jsx', () => {
  test('should extract', () => {
    const code = `
       import { stack, hstack as aliased } from "styled-system/patterns"

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
              "column": 32,
              "line": 7,
              "node": "CallExpression",
              "type": "map",
              "value": Map {
                "align" => {
                  "column": 47,
                  "line": 7,
                  "node": "StringLiteral",
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
              "column": 32,
              "line": 8,
              "node": "CallExpression",
              "type": "map",
              "value": Map {
                "justify" => {
                  "column": 51,
                  "line": 8,
                  "node": "StringLiteral",
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
