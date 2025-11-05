import { describe, test, expect } from 'vitest'
import { jsxParser, parseAndExtract } from './fixture'

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
            "endColumn": 68,
            "endLineNumber": 7,
            "line": 7,
            "node": "JsxOpeningElement",
            "type": "map",
            "value": Map {
              "marginTop" => {
                "column": 41,
                "endColumn": 47,
                "endLineNumber": 7,
                "line": 7,
                "node": "StringLiteral",
                "type": "literal",
                "value": "40px",
              },
              "marginBottom" => {
                "column": 61,
                "endColumn": 67,
                "endLineNumber": 7,
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
            "endColumn": 41,
            "endLineNumber": 8,
            "line": 8,
            "node": "JsxOpeningElement",
            "type": "map",
            "value": Map {
              "bg" => {
                "column": 31,
                "endColumn": 40,
                "endLineNumber": 8,
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
            "endColumn": 69,
            "endLineNumber": 7,
            "line": 7,
            "node": "JsxOpeningElement",
            "type": "map",
            "value": Map {
              "marginTop" => {
                "column": 42,
                "endColumn": 48,
                "endLineNumber": 7,
                "line": 7,
                "node": "StringLiteral",
                "type": "literal",
                "value": "40px",
              },
              "marginBottom" => {
                "column": 62,
                "endColumn": 68,
                "endLineNumber": 7,
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
            "endColumn": 42,
            "endLineNumber": 8,
            "line": 8,
            "node": "JsxOpeningElement",
            "type": "map",
            "value": Map {
              "bg" => {
                "column": 32,
                "endColumn": 41,
                "endLineNumber": 8,
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
            "endColumn": 95,
            "endLineNumber": 8,
            "line": 8,
            "node": "JsxOpeningElement",
            "type": "map",
            "value": Map {
              "marginTop" => {
                "column": 42,
                "endColumn": 73,
                "endLineNumber": 8,
                "line": 8,
                "node": "ObjectLiteralExpression",
                "type": "map",
                "value": Map {
                  "sm" => {
                    "column": 47,
                    "endColumn": 53,
                    "endLineNumber": 8,
                    "line": 8,
                    "node": "StringLiteral",
                    "type": "literal",
                    "value": "40px",
                  },
                  "md" => {
                    "column": 59,
                    "endColumn": 72,
                    "endLineNumber": 8,
                    "line": 8,
                    "node": "ObjectLiteralExpression",
                    "type": "map",
                    "value": Map {
                      "rtl" => {
                        "column": 65,
                        "endColumn": 71,
                        "endLineNumber": 8,
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
                "endColumn": 94,
                "endLineNumber": 8,
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
            "endColumn": 41,
            "endLineNumber": 9,
            "line": 9,
            "node": "JsxOpeningElement",
            "type": "map",
            "value": Map {
              "bg" => {
                "column": 31,
                "endColumn": 40,
                "endLineNumber": 9,
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
            "endColumn": 91,
            "endLineNumber": 8,
            "line": 8,
            "node": "JsxOpeningElement",
            "type": "map",
            "value": Map {
              "marginLeft" => {
                "column": 54,
                "endColumn": 60,
                "endLineNumber": 8,
                "line": 8,
                "node": "StringLiteral",
                "type": "literal",
                "value": "40px",
              },
              "marginBottom" => {
                "column": 84,
                "endColumn": 90,
                "endLineNumber": 8,
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
            "endColumn": 52,
            "endLineNumber": 8,
            "line": 8,
            "node": "JsxOpeningElement",
            "type": "map",
            "value": Map {
              "css" => {
                "column": 33,
                "endColumn": 50,
                "endLineNumber": 8,
                "line": 8,
                "node": "ObjectLiteralExpression",
                "type": "map",
                "value": Map {
                  "bg" => {
                    "column": 39,
                    "endColumn": 48,
                    "endLineNumber": 8,
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
            "endColumn": 13,
            "endLineNumber": 19,
            "line": 8,
            "node": "JsxSelfClosingElement",
            "type": "map",
            "value": Map {
              "backgroundImage" => {
                "column": 31,
                "endColumn": 17,
                "endLineNumber": 18,
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

  test('should extract array css prop', () => {
    const code = `
       import { styled } from "styled-system/jsx"

       function Button() {
         return (
            <>
              <styled.div css={[{ color: 'blue.300' }, { backgroundColor: 'green.300' }]}>
                array css prop
              </styled.div>
              <styled.div css={{ color: 'yellow.300' }}>
                simple css prop
              </styled.div>
            </>
        )
       }
     `

    const result = parseAndExtract(code)

    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "css": [
                {
                  "color": "blue.300",
                },
                {
                  "backgroundColor": "green.300",
                },
              ],
            },
          ],
          "name": "styled.div",
          "type": "jsx-factory",
        },
        {
          "data": [
            {
              "css": {
                "color": "yellow.300",
              },
            },
          ],
          "name": "styled.div",
          "type": "jsx-factory",
        },
      ]
    `)
    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .c_blue\\.300 {
          color: var(--colors-blue-300);
      }

        .bg-c_green\\.300 {
          background-color: var(--colors-green-300);
      }

        .c_yellow\\.300 {
          color: var(--colors-yellow-300);
      }
      }"
    `)
  })
})
