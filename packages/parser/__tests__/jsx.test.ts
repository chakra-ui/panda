import { describe, test, expect } from 'vitest'
import { jsxParser } from './fixture'

describe('jsx', () => {
  test('should extract', () => {
    const code = `
       import { panda } from ".panda/jsx"

       function Button() {
         return (
            <div marginTop="55555px">
               <panda.button marginTop="40px" marginBottom="42px">Click me</panda.button>
               <panda.div bg="red.200">Click me</panda.div>
            </div>
        )
       }
     `

    expect(jsxParser(code)).toMatchInlineSnapshot(`
      Set {
        {
          "box": {
            "column": 16,
            "line": 7,
            "node": "JsxOpeningElement",
            "stack": [],
            "type": "map",
            "value": Map {
              "marginTop" => {
                "column": 40,
                "line": 7,
                "node": "StringLiteral",
                "stack": [
                  "JsxAttribute",
                  "StringLiteral",
                ],
                "type": "literal",
                "value": "40px",
              },
              "marginBottom" => {
                "column": 60,
                "line": 7,
                "node": "StringLiteral",
                "stack": [
                  "JsxAttribute",
                  "StringLiteral",
                ],
                "type": "literal",
                "value": "42px",
              },
            },
          },
          "data": [
            {
              "marginBottom": "42px",
              "marginTop": "40px",
            },
          ],
          "name": "panda.button",
          "type": "jsx-factory",
        },
        {
          "box": {
            "column": 16,
            "line": 8,
            "node": "JsxOpeningElement",
            "stack": [],
            "type": "map",
            "value": Map {
              "bg" => {
                "column": 30,
                "line": 8,
                "node": "StringLiteral",
                "stack": [
                  "JsxAttribute",
                  "StringLiteral",
                ],
                "type": "literal",
                "value": "red.200",
              },
            },
          },
          "data": [
            {
              "bg": "red.200",
            },
          ],
          "name": "panda.div",
          "type": "jsx-factory",
        },
      }
    `)
  })

  test('[import alias] should extract', () => {
    const code = `
       import { panda as styled } from ".panda/jsx"

       function Button() {
         return (
            <div marginTop="55555px">
               <styled.button marginTop="40px" marginBottom="42px">Click me</styled.button>
               <styled.div bg="red.200">Click me</styled.div>
            </div>
        )
       }
     `

    expect(jsxParser(code)).toMatchInlineSnapshot(`
      Set {
        {
          "box": {
            "column": 16,
            "line": 7,
            "node": "JsxOpeningElement",
            "stack": [],
            "type": "map",
            "value": Map {
              "marginTop" => {
                "column": 41,
                "line": 7,
                "node": "StringLiteral",
                "stack": [
                  "JsxAttribute",
                  "StringLiteral",
                ],
                "type": "literal",
                "value": "40px",
              },
              "marginBottom" => {
                "column": 61,
                "line": 7,
                "node": "StringLiteral",
                "stack": [
                  "JsxAttribute",
                  "StringLiteral",
                ],
                "type": "literal",
                "value": "42px",
              },
            },
          },
          "data": [
            {
              "marginBottom": "42px",
              "marginTop": "40px",
            },
          ],
          "name": "styled.button",
          "type": "jsx-factory",
        },
        {
          "box": {
            "column": 16,
            "line": 8,
            "node": "JsxOpeningElement",
            "stack": [],
            "type": "map",
            "value": Map {
              "bg" => {
                "column": 31,
                "line": 8,
                "node": "StringLiteral",
                "stack": [
                  "JsxAttribute",
                  "StringLiteral",
                ],
                "type": "literal",
                "value": "red.200",
              },
            },
          },
          "data": [
            {
              "bg": "red.200",
            },
          ],
          "name": "styled.div",
          "type": "jsx-factory",
        },
      }
    `)
  })

  test('should extract responsive', () => {
    const code = `
       import { panda } from ".panda/jsx"

       function Button() {
        const disabled = true
         return (
            <div marginTop="55555px">
               <panda.button marginTop={{sm: "40px", md: {rtl: "40px"}}} marginBottom="42px">Click me</panda.button>
               <panda.div bg="red.200">Click me</panda.div>
            </div>
        )
       }
     `

    expect(jsxParser(code)).toMatchInlineSnapshot(`
      Set {
        {
          "box": {
            "column": 16,
            "line": 8,
            "node": "JsxOpeningElement",
            "stack": [],
            "type": "map",
            "value": Map {
              "marginTop" => {
                "column": 41,
                "line": 8,
                "node": "ObjectLiteralExpression",
                "stack": [
                  "JsxAttribute",
                  "JsxExpression",
                  "ObjectLiteralExpression",
                ],
                "type": "map",
                "value": Map {
                  "sm" => {
                    "column": 46,
                    "line": 8,
                    "node": "StringLiteral",
                    "stack": [
                      "JsxAttribute",
                      "JsxExpression",
                      "ObjectLiteralExpression",
                      "PropertyAssignment",
                      "StringLiteral",
                    ],
                    "type": "literal",
                    "value": "40px",
                  },
                  "md" => {
                    "column": 58,
                    "line": 8,
                    "node": "ObjectLiteralExpression",
                    "stack": [
                      "JsxAttribute",
                      "JsxExpression",
                      "ObjectLiteralExpression",
                      "PropertyAssignment",
                      "ObjectLiteralExpression",
                    ],
                    "type": "map",
                    "value": Map {
                      "rtl" => {
                        "column": 64,
                        "line": 8,
                        "node": "StringLiteral",
                        "stack": [
                          "JsxAttribute",
                          "JsxExpression",
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
              "marginBottom" => {
                "column": 87,
                "line": 8,
                "node": "StringLiteral",
                "stack": [
                  "JsxAttribute",
                  "StringLiteral",
                ],
                "type": "literal",
                "value": "42px",
              },
            },
          },
          "data": [
            {
              "marginBottom": "42px",
              "marginTop": {
                "md": {
                  "rtl": "40px",
                },
                "sm": "40px",
              },
            },
          ],
          "name": "panda.button",
          "type": "jsx-factory",
        },
        {
          "box": {
            "column": 16,
            "line": 9,
            "node": "JsxOpeningElement",
            "stack": [],
            "type": "map",
            "value": Map {
              "bg" => {
                "column": 30,
                "line": 9,
                "node": "StringLiteral",
                "stack": [
                  "JsxAttribute",
                  "StringLiteral",
                ],
                "type": "literal",
                "value": "red.200",
              },
            },
          },
          "data": [
            {
              "bg": "red.200",
            },
          ],
          "name": "panda.div",
          "type": "jsx-factory",
        },
      }
    `)
  })

  test('should extract conditions', () => {
    const code = `
       import { panda } from ".panda/jsx"

       function Button() {
        const disabled = true
         return (
            <div marginTop="55555px">
               <panda.button marginLeft={disabled ? "40px" : "50px"} marginBottom="42px">Click me</panda.button>
            </div>
        )
       }
     `

    expect(jsxParser(code)).toMatchInlineSnapshot(`
      Set {
        {
          "box": {
            "column": 16,
            "line": 8,
            "node": "JsxOpeningElement",
            "stack": [],
            "type": "map",
            "value": Map {
              "marginLeft" => {
                "column": 53,
                "line": 8,
                "node": "StringLiteral",
                "stack": [
                  "JsxAttribute",
                  "JsxExpression",
                  "ConditionalExpression",
                ],
                "type": "literal",
                "value": "40px",
              },
              "marginBottom" => {
                "column": 83,
                "line": 8,
                "node": "StringLiteral",
                "stack": [
                  "JsxAttribute",
                  "StringLiteral",
                ],
                "type": "literal",
                "value": "42px",
              },
            },
          },
          "data": [
            {
              "marginBottom": "42px",
              "marginLeft": "40px",
            },
          ],
          "name": "panda.button",
          "type": "jsx-factory",
        },
      }
    `)
  })

  test('should extract object prop', () => {
    const code = `
       import { panda } from ".panda/jsx"

       function Button() {
        const disabled = true
         return (
            <div marginTop="55555px">
               <panda.div css={{ bg: "red.200" }}>Click me</panda.div>
            </div>
        )
       }
     `

    expect(jsxParser(code)).toMatchInlineSnapshot(`
      Set {
        {
          "box": {
            "column": 16,
            "line": 8,
            "node": "JsxOpeningElement",
            "stack": [],
            "type": "map",
            "value": Map {
              "css" => {
                "column": 32,
                "line": 8,
                "node": "ObjectLiteralExpression",
                "stack": [
                  "JsxAttribute",
                  "JsxExpression",
                  "ObjectLiteralExpression",
                ],
                "type": "map",
                "value": Map {
                  "bg" => {
                    "column": 38,
                    "line": 8,
                    "node": "StringLiteral",
                    "stack": [
                      "JsxAttribute",
                      "JsxExpression",
                      "ObjectLiteralExpression",
                      "PropertyAssignment",
                      "StringLiteral",
                    ],
                    "type": "literal",
                    "value": "red.200",
                  },
                },
              },
            },
          },
          "data": [
            {
              "css": {
                "bg": "red.200",
              },
            },
          ],
          "name": "panda.div",
          "type": "jsx-factory",
        },
      }
    `)
  })

  test('should omit new line characters', () => {
    const code = `
       import { panda } from ".panda/jsx"

       function Button() {
        const disabled = true
         return (
            <div marginTop="55555px">
            <panda.div
              backgroundImage="linear-gradient(
                135deg,
                hsla(0, 0%, 100%, 0.75) 10%,
                transparent 0,
                transparent 50%,
                hsla(0, 0%, 100%, 0.75) 0,
                hsla(0, 0%, 100%, 0.75) 60%,
                transparent 0,
                transparent
              )"
          />
            </div>
        )
       }
     `

    expect(jsxParser(code)).toMatchInlineSnapshot(`
      Set {
        {
          "box": {
            "column": 13,
            "line": 8,
            "node": "JsxSelfClosingElement",
            "stack": [],
            "type": "map",
            "value": Map {
              "backgroundImage" => {
                "column": 31,
                "line": 9,
                "node": "StringLiteral",
                "stack": [
                  "JsxAttribute",
                  "StringLiteral",
                ],
                "type": "literal",
                "value": "linear-gradient( 135deg, hsla(0, 0%, 100%, 0.75) 10%, transparent 0, transparent 50%, hsla(0, 0%, 100%, 0.75) 0, hsla(0, 0%, 100%, 0.75) 60%, transparent 0, transparent )",
              },
            },
          },
          "data": [
            {
              "backgroundImage": "linear-gradient( 135deg, hsla(0, 0%, 100%, 0.75) 10%, transparent 0, transparent 50%, hsla(0, 0%, 100%, 0.75) 0, hsla(0, 0%, 100%, 0.75) 60%, transparent 0, transparent )",
            },
          ],
          "name": "panda.div",
          "type": "jsx-factory",
        },
      }
    `)
  })
})
