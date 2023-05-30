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
            "box": {
              "column": 23,
              "line": 4,
              "node": "CallExpression",
              "stack": [
                "CallExpression",
                "ObjectLiteralExpression",
              ],
              "type": "map",
              "value": Map {
                "base" => {
                  "column": 15,
                  "line": 5,
                  "node": "ObjectLiteralExpression",
                  "stack": [
                    "CallExpression",
                    "ObjectLiteralExpression",
                    "PropertyAssignment",
                    "ObjectLiteralExpression",
                  ],
                  "type": "map",
                  "value": Map {
                    "color" => {
                      "column": 20,
                      "line": 6,
                      "node": "StringLiteral",
                      "stack": [
                        "CallExpression",
                        "ObjectLiteralExpression",
                        "PropertyAssignment",
                        "ObjectLiteralExpression",
                        "PropertyAssignment",
                        "StringLiteral",
                      ],
                      "type": "literal",
                      "value": "red",
                    },
                    "fontSize" => {
                      "column": 23,
                      "line": 7,
                      "node": "StringLiteral",
                      "stack": [
                        "CallExpression",
                        "ObjectLiteralExpression",
                        "PropertyAssignment",
                        "ObjectLiteralExpression",
                        "PropertyAssignment",
                        "StringLiteral",
                      ],
                      "type": "literal",
                      "value": "12px",
                    },
                  },
                },
                "variants" => {
                  "column": 19,
                  "line": 9,
                  "node": "ObjectLiteralExpression",
                  "stack": [
                    "CallExpression",
                    "ObjectLiteralExpression",
                    "PropertyAssignment",
                    "ObjectLiteralExpression",
                  ],
                  "type": "map",
                  "value": Map {
                    "color" => {
                      "column": 20,
                      "line": 10,
                      "node": "ObjectLiteralExpression",
                      "stack": [
                        "CallExpression",
                        "ObjectLiteralExpression",
                        "PropertyAssignment",
                        "ObjectLiteralExpression",
                        "PropertyAssignment",
                        "ObjectLiteralExpression",
                      ],
                      "type": "map",
                      "value": Map {
                        "red" => {
                          "column": 22,
                          "line": 11,
                          "node": "ObjectLiteralExpression",
                          "stack": [
                            "CallExpression",
                            "ObjectLiteralExpression",
                            "PropertyAssignment",
                            "ObjectLiteralExpression",
                            "PropertyAssignment",
                            "ObjectLiteralExpression",
                            "PropertyAssignment",
                            "ObjectLiteralExpression",
                          ],
                          "type": "map",
                          "value": Map {
                            "background" => {
                              "column": 33,
                              "line": 12,
                              "node": "StringLiteral",
                              "stack": [
                                "CallExpression",
                                "ObjectLiteralExpression",
                                "PropertyAssignment",
                                "ObjectLiteralExpression",
                                "PropertyAssignment",
                                "ObjectLiteralExpression",
                                "PropertyAssignment",
                                "ObjectLiteralExpression",
                                "PropertyAssignment",
                                "StringLiteral",
                              ],
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
            "name": "panda",
            "type": "cva",
          },
        },
      }
    `)
  })
})
