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
              "node": "CallExpression",
              "stack": [
                "CallExpression",
                "ObjectLiteralExpression",
              ],
              "type": "map",
              "value": Map {
                "base" => {
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
