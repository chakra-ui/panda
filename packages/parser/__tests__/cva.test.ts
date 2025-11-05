import { describe, expect, test } from 'vitest'
import { cvaParser } from './fixture'

describe('ast parser / cva', () => {
  test('should parse', () => {
    const code = `
    import {cva} from "styled-system/css"

    const baseStyle = cva({
        base: {
            color: 'red',
            fontSize: '12px',
        },
        variants: {
            color: {
                red: {
                    background: 'red'
                }
            },
            size: {
                sm: {
                    fontSize: '12px'
                },
                md: {
                    fontSize: '24px'
                }
            }
        },
        compoundVariants: [
            {
                color: 'red',
                size: 'sm',
                css: {
                    fontWeight: 'bold'
                }
            },
            {
                color: ['red', 'blue'],
                size: ['sm', 'md'],
                css: {
                    color: 'white'
                }
            }
        ]
    })
     `

    expect(cvaParser(code)).toMatchInlineSnapshot(`
      {
        "cva": Set {
          {
            "box": {
              "column": 23,
              "endColumn": 7,
              "endLineNumber": 40,
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
                  "endLineNumber": 23,
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
                    "size" => {
                      "column": 19,
                      "endColumn": 14,
                      "endLineNumber": 22,
                      "line": 15,
                      "node": "ObjectLiteralExpression",
                      "type": "map",
                      "value": Map {
                        "sm" => {
                          "column": 21,
                          "endColumn": 18,
                          "endLineNumber": 18,
                          "line": 16,
                          "node": "ObjectLiteralExpression",
                          "type": "map",
                          "value": Map {
                            "fontSize" => {
                              "column": 31,
                              "endColumn": 37,
                              "endLineNumber": 17,
                              "line": 17,
                              "node": "StringLiteral",
                              "type": "literal",
                              "value": "12px",
                            },
                          },
                        },
                        "md" => {
                          "column": 21,
                          "endColumn": 18,
                          "endLineNumber": 21,
                          "line": 19,
                          "node": "ObjectLiteralExpression",
                          "type": "map",
                          "value": Map {
                            "fontSize" => {
                              "column": 31,
                              "endColumn": 37,
                              "endLineNumber": 20,
                              "line": 20,
                              "node": "StringLiteral",
                              "type": "literal",
                              "value": "24px",
                            },
                          },
                        },
                      },
                    },
                  },
                },
                "compoundVariants" => {
                  "column": 27,
                  "endColumn": 10,
                  "endLineNumber": 39,
                  "line": 24,
                  "node": "ArrayLiteralExpression",
                  "type": "array",
                  "value": [
                    {
                      "column": 13,
                      "endColumn": 14,
                      "endLineNumber": 31,
                      "line": 25,
                      "node": "ObjectLiteralExpression",
                      "type": "map",
                      "value": Map {
                        "color" => {
                          "column": 24,
                          "endColumn": 29,
                          "endLineNumber": 26,
                          "line": 26,
                          "node": "StringLiteral",
                          "type": "literal",
                          "value": "red",
                        },
                        "size" => {
                          "column": 23,
                          "endColumn": 27,
                          "endLineNumber": 27,
                          "line": 27,
                          "node": "StringLiteral",
                          "type": "literal",
                          "value": "sm",
                        },
                        "css" => {
                          "column": 22,
                          "endColumn": 18,
                          "endLineNumber": 30,
                          "line": 28,
                          "node": "ObjectLiteralExpression",
                          "type": "map",
                          "value": Map {
                            "fontWeight" => {
                              "column": 33,
                              "endColumn": 39,
                              "endLineNumber": 29,
                              "line": 29,
                              "node": "StringLiteral",
                              "type": "literal",
                              "value": "bold",
                            },
                          },
                        },
                      },
                    },
                    {
                      "column": 13,
                      "endColumn": 14,
                      "endLineNumber": 38,
                      "line": 32,
                      "node": "ObjectLiteralExpression",
                      "type": "map",
                      "value": Map {
                        "color" => {
                          "column": 24,
                          "endColumn": 39,
                          "endLineNumber": 33,
                          "line": 33,
                          "node": "ArrayLiteralExpression",
                          "type": "array",
                          "value": [
                            {
                              "column": 25,
                              "endColumn": 30,
                              "endLineNumber": 33,
                              "line": 33,
                              "node": "StringLiteral",
                              "type": "literal",
                              "value": "red",
                            },
                            {
                              "column": 32,
                              "endColumn": 38,
                              "endLineNumber": 33,
                              "line": 33,
                              "node": "StringLiteral",
                              "type": "literal",
                              "value": "blue",
                            },
                          ],
                        },
                        "size" => {
                          "column": 23,
                          "endColumn": 35,
                          "endLineNumber": 34,
                          "line": 34,
                          "node": "ArrayLiteralExpression",
                          "type": "array",
                          "value": [
                            {
                              "column": 24,
                              "endColumn": 28,
                              "endLineNumber": 34,
                              "line": 34,
                              "node": "StringLiteral",
                              "type": "literal",
                              "value": "sm",
                            },
                            {
                              "column": 30,
                              "endColumn": 34,
                              "endLineNumber": 34,
                              "line": 34,
                              "node": "StringLiteral",
                              "type": "literal",
                              "value": "md",
                            },
                          ],
                        },
                        "css" => {
                          "column": 22,
                          "endColumn": 18,
                          "endLineNumber": 37,
                          "line": 35,
                          "node": "ObjectLiteralExpression",
                          "type": "map",
                          "value": Map {
                            "color" => {
                              "column": 28,
                              "endColumn": 35,
                              "endLineNumber": 36,
                              "line": 36,
                              "node": "StringLiteral",
                              "type": "literal",
                              "value": "white",
                            },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
            "data": [
              {
                "base": {
                  "color": "red",
                  "fontSize": "12px",
                },
                "compoundVariants": [
                  {
                    "color": "red",
                    "css": {
                      "fontWeight": "bold",
                    },
                    "size": "sm",
                  },
                  {
                    "color": [
                      "red",
                      "blue",
                    ],
                    "css": {
                      "color": "white",
                    },
                    "size": [
                      "sm",
                      "md",
                    ],
                  },
                ],
                "variants": {
                  "color": {
                    "red": {
                      "background": "red",
                    },
                  },
                  "size": {
                    "md": {
                      "fontSize": "24px",
                    },
                    "sm": {
                      "fontSize": "12px",
                    },
                  },
                },
              },
            ],
            "name": "cva",
            "type": "cva",
          },
        },
      }
    `)
  })
})
