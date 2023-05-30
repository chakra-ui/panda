import { describe, expect, test } from 'vitest'
import { cssParser } from './fixture'

describe('ast parser', () => {
  test('[without import] should not parse', () => {
    const code = `
    import {css} from ".panda/css"

        const baseStyle = css({
            color: 'red',
            fontSize: '12px',
        })

        const testStyle = css({
          bg: "red.300",
          margin: { xs: "0", lg:"40px" },
        })

        const welcome = css({
          '[dir=rtl]': {
            textAlign: 'right',
          }
          '&[data-state=closed]': {
            animation: 'exit',
            fadeOut: '0.2',
          },
        })
     `

    expect(cssParser(code)).toMatchInlineSnapshot(`
      {
        "css": Set {
          {
            "box": {
              "node": "CallExpression",
              "stack": [
                "CallExpression",
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
                    "StringLiteral",
                  ],
                  "type": "literal",
                  "value": "12px",
                },
              },
            },
            "data": [
              {
                "color": "red",
                "fontSize": "12px",
              },
            ],
            "name": "css",
            "type": "object",
          },
          {
            "box": {
              "node": "CallExpression",
              "stack": [
                "CallExpression",
                "ObjectLiteralExpression",
              ],
              "type": "map",
              "value": Map {
                "bg" => {
                  "node": "StringLiteral",
                  "stack": [
                    "CallExpression",
                    "ObjectLiteralExpression",
                    "PropertyAssignment",
                    "StringLiteral",
                  ],
                  "type": "literal",
                  "value": "red.300",
                },
                "margin" => {
                  "node": "ObjectLiteralExpression",
                  "stack": [
                    "CallExpression",
                    "ObjectLiteralExpression",
                    "PropertyAssignment",
                    "ObjectLiteralExpression",
                  ],
                  "type": "map",
                  "value": Map {
                    "xs" => {
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
                      "value": "0",
                    },
                    "lg" => {
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
                      "value": "40px",
                    },
                  },
                },
              },
            },
            "data": [
              {
                "bg": "red.300",
                "margin": {
                  "lg": "40px",
                  "xs": "0",
                },
              },
            ],
            "name": "css",
            "type": "object",
          },
          {
            "box": {
              "node": "CallExpression",
              "stack": [
                "CallExpression",
                "ObjectLiteralExpression",
              ],
              "type": "map",
              "value": Map {
                "[dir=rtl]" => {
                  "node": "ObjectLiteralExpression",
                  "stack": [
                    "CallExpression",
                    "ObjectLiteralExpression",
                    "PropertyAssignment",
                    "ObjectLiteralExpression",
                  ],
                  "type": "map",
                  "value": Map {
                    "textAlign" => {
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
                      "value": "right",
                    },
                  },
                },
                "&[data-state=closed]" => {
                  "node": "ObjectLiteralExpression",
                  "stack": [
                    "CallExpression",
                    "ObjectLiteralExpression",
                    "PropertyAssignment",
                    "ObjectLiteralExpression",
                  ],
                  "type": "map",
                  "value": Map {
                    "animation" => {
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
                      "value": "exit",
                    },
                    "fadeOut" => {
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
                      "value": "0.2",
                    },
                  },
                },
              },
            },
            "data": [
              {
                "&[data-state=closed]": {
                  "animation": "exit",
                  "fadeOut": "0.2",
                },
                "[dir=rtl]": {
                  "textAlign": "right",
                },
              },
            ],
            "name": "css",
            "type": "object",
          },
        },
      }
    `)
  })
})
