import { describe, expect, test } from 'vitest'
import { svaParser } from './fixture'

describe('ast parser / sva', () => {
  test('should parse', () => {
    const code = `
    import {sva} from "styled-system/css"

    const button = sva({
        slots: ['label', 'icon'],
        base: {
            label: {
            color: 'red',
            },
            icon: {
            fontSize: 'lg',
            },
        },
    })
     `

    expect(svaParser(code)).toMatchInlineSnapshot(`
      {
        "sva": Set {
          {
            "box": {
              "column": 20,
              "line": 4,
              "node": "CallExpression",
              "type": "map",
              "value": Map {
                "slots" => {
                  "column": 16,
                  "line": 5,
                  "node": "ArrayLiteralExpression",
                  "type": "array",
                  "value": [
                    {
                      "column": 17,
                      "line": 5,
                      "node": "StringLiteral",
                      "type": "literal",
                      "value": "label",
                    },
                    {
                      "column": 26,
                      "line": 5,
                      "node": "StringLiteral",
                      "type": "literal",
                      "value": "icon",
                    },
                  ],
                },
                "base" => {
                  "column": 15,
                  "line": 6,
                  "node": "ObjectLiteralExpression",
                  "type": "map",
                  "value": Map {
                    "label" => {
                      "column": 20,
                      "line": 7,
                      "node": "ObjectLiteralExpression",
                      "type": "map",
                      "value": Map {
                        "color" => {
                          "column": 20,
                          "line": 8,
                          "node": "StringLiteral",
                          "type": "literal",
                          "value": "red",
                        },
                      },
                    },
                    "icon" => {
                      "column": 19,
                      "line": 10,
                      "node": "ObjectLiteralExpression",
                      "type": "map",
                      "value": Map {
                        "fontSize" => {
                          "column": 23,
                          "line": 11,
                          "node": "StringLiteral",
                          "type": "literal",
                          "value": "lg",
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
                  "icon": {
                    "fontSize": "lg",
                  },
                  "label": {
                    "color": "red",
                  },
                },
                "slots": [
                  "label",
                  "icon",
                ],
              },
            ],
            "name": "sva",
            "type": "object",
          },
        },
      }
    `)
  })
})
