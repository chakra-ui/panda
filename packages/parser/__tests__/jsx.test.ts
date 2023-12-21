import { describe, test, expect } from 'vitest'
import { jsxParser } from './fixture'

describe('jsx', () => {
  test('should extract', () => {
    const code = `
       import { styled } from "styled-system/jsx"

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
            "type": "map",
            "value": Map {
              "marginTop" => {
                "column": 41,
                "line": 7,
                "node": "StringLiteral",
                "type": "literal",
                "value": "40px",
              },
              "marginBottom" => {
                "column": 61,
                "line": 7,
                "node": "StringLiteral",
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
            "type": "map",
            "value": Map {
              "bg" => {
                "column": 31,
                "line": 8,
                "node": "StringLiteral",
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

  test('[import alias] should extract', () => {
    const code = `
       import { styled as aliased } from "styled-system/jsx"

       function Button() {
         return (
            <div marginTop="55555px">
               <aliased.button marginTop="40px" marginBottom="42px">Click me</aliased.button>
               <aliased.div bg="red.200">Click me</aliased.div>
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
            "type": "map",
            "value": Map {
              "marginTop" => {
                "column": 42,
                "line": 7,
                "node": "StringLiteral",
                "type": "literal",
                "value": "40px",
              },
              "marginBottom" => {
                "column": 62,
                "line": 7,
                "node": "StringLiteral",
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
          "name": "aliased.button",
          "type": "jsx-factory",
        },
        {
          "box": {
            "column": 16,
            "line": 8,
            "node": "JsxOpeningElement",
            "type": "map",
            "value": Map {
              "bg" => {
                "column": 32,
                "line": 8,
                "node": "StringLiteral",
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
          "name": "aliased.div",
          "type": "jsx-factory",
        },
      }
    `)
  })

  test('should extract responsive', () => {
    const code = `
       import { styled } from "styled-system/jsx"

       function Button() {
        const disabled = true
         return (
            <div marginTop="55555px">
               <styled.button marginTop={{sm: "40px", md: {rtl: "40px"}}} marginBottom="42px">Click me</styled.button>
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
            "line": 8,
            "node": "JsxOpeningElement",
            "type": "map",
            "value": Map {
              "marginTop" => {
                "column": 42,
                "line": 8,
                "node": "ObjectLiteralExpression",
                "type": "map",
                "value": Map {
                  "sm" => {
                    "column": 47,
                    "line": 8,
                    "node": "StringLiteral",
                    "type": "literal",
                    "value": "40px",
                  },
                  "md" => {
                    "column": 59,
                    "line": 8,
                    "node": "ObjectLiteralExpression",
                    "type": "map",
                    "value": Map {
                      "rtl" => {
                        "column": 65,
                        "line": 8,
                        "node": "StringLiteral",
                        "type": "literal",
                        "value": "40px",
                      },
                    },
                  },
                },
              },
              "marginBottom" => {
                "column": 88,
                "line": 8,
                "node": "StringLiteral",
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
          "name": "styled.button",
          "type": "jsx-factory",
        },
        {
          "box": {
            "column": 16,
            "line": 9,
            "node": "JsxOpeningElement",
            "type": "map",
            "value": Map {
              "bg" => {
                "column": 31,
                "line": 9,
                "node": "StringLiteral",
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

  test('should extract conditions', () => {
    const code = `
       import { styled } from "styled-system/jsx"

       function Button() {
        const disabled = true
         return (
            <div marginTop="55555px">
               <styled.button marginLeft={disabled ? "40px" : "50px"} marginBottom="42px">Click me</styled.button>
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
            "type": "map",
            "value": Map {
              "marginLeft" => {
                "column": 54,
                "line": 8,
                "node": "StringLiteral",
                "type": "literal",
                "value": "40px",
              },
              "marginBottom" => {
                "column": 84,
                "line": 8,
                "node": "StringLiteral",
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
          "name": "styled.button",
          "type": "jsx-factory",
        },
      }
    `)
  })

  test('should extract object prop', () => {
    const code = `
       import { styled } from "styled-system/jsx"

       function Button() {
        const disabled = true
         return (
            <div marginTop="55555px">
               <styled.div css={{ bg: "red.200" }}>Click me</styled.div>
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
            "type": "map",
            "value": Map {
              "css" => {
                "column": 33,
                "line": 8,
                "node": "ObjectLiteralExpression",
                "type": "map",
                "value": Map {
                  "bg" => {
                    "column": 39,
                    "line": 8,
                    "node": "StringLiteral",
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
          "name": "styled.div",
          "type": "jsx-factory",
        },
      }
    `)
  })

  test('should omit new line characters', () => {
    const code = `
       import { styled } from "styled-system/jsx"

       function Button() {
        const disabled = true
         return (
            <div marginTop="55555px">
            <styled.div
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
            "type": "map",
            "value": Map {
              "backgroundImage" => {
                "column": 31,
                "line": 9,
                "node": "StringLiteral",
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
          "name": "styled.div",
          "type": "jsx-factory",
        },
      }
    `)
  })
})
