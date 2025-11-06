import { describe, expect, test } from 'vitest'
import { styledParser } from './fixture'

describe('ast parser / styled', () => {
  test('should parse', () => {
    const code = `
    import { styled } from "styled-system/jsx"

    const baseStyle = styled("div", {
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
            "box": {
              "column": 23,
              "endColumn": 7,
              "endLineNumber": 16,
              "line": 4,
              "node": "CallExpression",
              "type": "map",
              "value": Map {
                "base" => {
                  "column": 15,
                  "endColumn": 10,
                  "endLineNumber": 8,
                  "line": 5,
                  "node": "ObjectLiteralExpression",
                  "type": "map",
                  "value": Map {
                    "color" => {
                      "column": 20,
                      "endColumn": 25,
                      "endLineNumber": 6,
                      "line": 6,
                      "node": "StringLiteral",
                      "type": "literal",
                      "value": "red",
                    },
                    "fontSize" => {
                      "column": 23,
                      "endColumn": 29,
                      "endLineNumber": 7,
                      "line": 7,
                      "node": "StringLiteral",
                      "type": "literal",
                      "value": "12px",
                    },
                  },
                },
                "variants" => {
                  "column": 19,
                  "endColumn": 10,
                  "endLineNumber": 15,
                  "line": 9,
                  "node": "ObjectLiteralExpression",
                  "type": "map",
                  "value": Map {
                    "color" => {
                      "column": 20,
                      "endColumn": 14,
                      "endLineNumber": 14,
                      "line": 10,
                      "node": "ObjectLiteralExpression",
                      "type": "map",
                      "value": Map {
                        "red" => {
                          "column": 22,
                          "endColumn": 18,
                          "endLineNumber": 13,
                          "line": 11,
                          "node": "ObjectLiteralExpression",
                          "type": "map",
                          "value": Map {
                            "background" => {
                              "column": 33,
                              "endColumn": 38,
                              "endLineNumber": 12,
                              "line": 12,
                              "node": "StringLiteral",
                              "type": "literal",
                              "value": "red",
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "data": [
              {
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
            ],
            "name": "styled",
            "type": "cva",
          },
        },
      }
    `)
  })
})
