import { describe, expect, test } from 'vitest'
import { cssParser } from './fixture'

describe('ast parser', () => {
  test('[without import] should not parse', () => {
    const code = `
    import {css} from "styled-system/css"

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
              "column": 27,
              "endColumn": 11,
              "endLineNumber": 7,
              "line": 4,
              "node": "CallExpression",
              "type": "map",
              "value": Map {
                "color" => {
                  "column": 20,
                  "endColumn": 25,
                  "endLineNumber": 5,
                  "line": 5,
                  "node": "StringLiteral",
                  "type": "literal",
                  "value": "red",
                },
                "fontSize" => {
                  "column": 23,
                  "endColumn": 29,
                  "endLineNumber": 6,
                  "line": 6,
                  "node": "StringLiteral",
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
            "type": "css",
          },
          {
            "box": {
              "column": 27,
              "endColumn": 11,
              "endLineNumber": 12,
              "line": 9,
              "node": "CallExpression",
              "type": "map",
              "value": Map {
                "bg" => {
                  "column": 15,
                  "endColumn": 24,
                  "endLineNumber": 10,
                  "line": 10,
                  "node": "StringLiteral",
                  "type": "literal",
                  "value": "red.300",
                },
                "margin" => {
                  "column": 19,
                  "endColumn": 41,
                  "endLineNumber": 11,
                  "line": 11,
                  "node": "ObjectLiteralExpression",
                  "type": "map",
                  "value": Map {
                    "xs" => {
                      "column": 25,
                      "endColumn": 28,
                      "endLineNumber": 11,
                      "line": 11,
                      "node": "StringLiteral",
                      "type": "literal",
                      "value": "0",
                    },
                    "lg" => {
                      "column": 33,
                      "endColumn": 39,
                      "endLineNumber": 11,
                      "line": 11,
                      "node": "StringLiteral",
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
            "type": "css",
          },
          {
            "box": {
              "column": 25,
              "endColumn": 11,
              "endLineNumber": 22,
              "line": 14,
              "node": "CallExpression",
              "type": "map",
              "value": Map {
                "[dir=rtl]" => {
                  "column": 24,
                  "endColumn": 12,
                  "endLineNumber": 17,
                  "line": 15,
                  "node": "ObjectLiteralExpression",
                  "type": "map",
                  "value": Map {
                    "textAlign" => {
                      "column": 24,
                      "endColumn": 31,
                      "endLineNumber": 16,
                      "line": 16,
                      "node": "StringLiteral",
                      "type": "literal",
                      "value": "right",
                    },
                  },
                },
                "&[data-state=closed]" => {
                  "column": 35,
                  "endColumn": 12,
                  "endLineNumber": 21,
                  "line": 18,
                  "node": "ObjectLiteralExpression",
                  "type": "map",
                  "value": Map {
                    "animation" => {
                      "column": 24,
                      "endColumn": 30,
                      "endLineNumber": 19,
                      "line": 19,
                      "node": "StringLiteral",
                      "type": "literal",
                      "value": "exit",
                    },
                    "fadeOut" => {
                      "column": 22,
                      "endColumn": 27,
                      "endLineNumber": 20,
                      "line": 20,
                      "node": "StringLiteral",
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
            "type": "css",
          },
        },
      }
    `)
  })
})
