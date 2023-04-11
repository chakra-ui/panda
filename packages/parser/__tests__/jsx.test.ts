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
          "box": BoxNodeMap {
            "node": JsxOpeningElement,
            "spreadConditions": undefined,
            "stack": [],
            "type": "map",
            "value": Map {
              "marginTop" => BoxNodeLiteral {
                "kind": "string",
                "node": StringLiteral,
                "stack": [
                  JsxAttribute,
                  StringLiteral,
                ],
                "type": "literal",
                "value": "40px",
              },
              "marginBottom" => BoxNodeLiteral {
                "kind": "string",
                "node": StringLiteral,
                "stack": [
                  JsxAttribute,
                  StringLiteral,
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
          "box": BoxNodeMap {
            "node": JsxOpeningElement,
            "spreadConditions": undefined,
            "stack": [],
            "type": "map",
            "value": Map {
              "bg" => BoxNodeLiteral {
                "kind": "string",
                "node": StringLiteral,
                "stack": [
                  JsxAttribute,
                  StringLiteral,
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
          "box": BoxNodeMap {
            "node": JsxOpeningElement,
            "spreadConditions": undefined,
            "stack": [],
            "type": "map",
            "value": Map {
              "marginTop" => BoxNodeLiteral {
                "kind": "string",
                "node": StringLiteral,
                "stack": [
                  JsxAttribute,
                  StringLiteral,
                ],
                "type": "literal",
                "value": "40px",
              },
              "marginBottom" => BoxNodeLiteral {
                "kind": "string",
                "node": StringLiteral,
                "stack": [
                  JsxAttribute,
                  StringLiteral,
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
          "box": BoxNodeMap {
            "node": JsxOpeningElement,
            "spreadConditions": undefined,
            "stack": [],
            "type": "map",
            "value": Map {
              "bg" => BoxNodeLiteral {
                "kind": "string",
                "node": StringLiteral,
                "stack": [
                  JsxAttribute,
                  StringLiteral,
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
          "box": BoxNodeMap {
            "node": JsxOpeningElement,
            "spreadConditions": undefined,
            "stack": [],
            "type": "map",
            "value": Map {
              "marginTop" => BoxNodeMap {
                "node": ObjectLiteralExpression,
                "spreadConditions": undefined,
                "stack": [
                  JsxAttribute,
                  JsxExpression,
                  ObjectLiteralExpression,
                ],
                "type": "map",
                "value": Map {
                  "sm" => BoxNodeLiteral {
                    "kind": "string",
                    "node": StringLiteral,
                    "stack": [
                      JsxAttribute,
                      JsxExpression,
                      ObjectLiteralExpression,
                      PropertyAssignment,
                      StringLiteral,
                    ],
                    "type": "literal",
                    "value": "40px",
                  },
                  "md" => BoxNodeMap {
                    "node": ObjectLiteralExpression,
                    "spreadConditions": undefined,
                    "stack": [
                      JsxAttribute,
                      JsxExpression,
                      ObjectLiteralExpression,
                      PropertyAssignment,
                      ObjectLiteralExpression,
                    ],
                    "type": "map",
                    "value": Map {
                      "rtl" => BoxNodeLiteral {
                        "kind": "string",
                        "node": StringLiteral,
                        "stack": [
                          JsxAttribute,
                          JsxExpression,
                          ObjectLiteralExpression,
                          PropertyAssignment,
                          ObjectLiteralExpression,
                          PropertyAssignment,
                          StringLiteral,
                        ],
                        "type": "literal",
                        "value": "40px",
                      },
                    },
                  },
                },
              },
              "marginBottom" => BoxNodeLiteral {
                "kind": "string",
                "node": StringLiteral,
                "stack": [
                  JsxAttribute,
                  StringLiteral,
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
          "box": BoxNodeMap {
            "node": JsxOpeningElement,
            "spreadConditions": undefined,
            "stack": [],
            "type": "map",
            "value": Map {
              "bg" => BoxNodeLiteral {
                "kind": "string",
                "node": StringLiteral,
                "stack": [
                  JsxAttribute,
                  StringLiteral,
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
          "box": BoxNodeMap {
            "node": JsxOpeningElement,
            "spreadConditions": undefined,
            "stack": [],
            "type": "map",
            "value": Map {
              "marginLeft" => BoxNodeLiteral {
                "kind": "string",
                "node": StringLiteral,
                "stack": [
                  JsxAttribute,
                  JsxExpression,
                  ConditionalExpression,
                ],
                "type": "literal",
                "value": "40px",
              },
              "marginBottom" => BoxNodeLiteral {
                "kind": "string",
                "node": StringLiteral,
                "stack": [
                  JsxAttribute,
                  StringLiteral,
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
          "box": BoxNodeMap {
            "node": JsxOpeningElement,
            "spreadConditions": undefined,
            "stack": [],
            "type": "map",
            "value": Map {
              "css" => BoxNodeMap {
                "node": ObjectLiteralExpression,
                "spreadConditions": undefined,
                "stack": [
                  JsxAttribute,
                  JsxExpression,
                  ObjectLiteralExpression,
                ],
                "type": "map",
                "value": Map {
                  "bg" => BoxNodeLiteral {
                    "kind": "string",
                    "node": StringLiteral,
                    "stack": [
                      JsxAttribute,
                      JsxExpression,
                      ObjectLiteralExpression,
                      PropertyAssignment,
                      StringLiteral,
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
          "box": BoxNodeMap {
            "node": JsxSelfClosingElement,
            "spreadConditions": undefined,
            "stack": [],
            "type": "map",
            "value": Map {
              "backgroundImage" => BoxNodeLiteral {
                "kind": "string",
                "node": StringLiteral,
                "stack": [
                  JsxAttribute,
                  StringLiteral,
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
