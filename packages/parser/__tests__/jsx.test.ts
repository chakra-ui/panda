import { describe, test, expect } from 'vitest'
import { jsxParser, parseAndExtract } from './fixture'

describe('jsx', () => {
  const expectCompiledColorBoxResult = (code: string, jsxFramework: 'react' | 'preact' | 'solid' | 'vue' = 'react') => {
    const result = parseAndExtract(code, { jsxFramework })
    const colorBoxResults = result.json.filter((item) => item.name === 'ColorBox')

    expect(colorBoxResults).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "css": {
                "backgroundColor": "RebeccaPurple",
                "color": "black",
              },
            },
          ],
          "name": "ColorBox",
          "type": "jsx",
        },
        {
          "data": [
            {
              "css": {
                "backgroundColor": "SteelBlue",
                "color": "white",
              },
            },
          ],
          "name": "ColorBox",
          "type": "jsx",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .c_black {
          color: var(--colors-black);
      }

        .bg-c_RebeccaPurple {
          background-color: RebeccaPurple;
      }

        .c_white {
          color: var(--colors-white);
      }

        .bg-c_SteelBlue {
          background-color: SteelBlue;
      }
      }"
    `)
  }

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

  test('should extract *Css prop aliases', () => {
    const code = `
      import { styled } from "styled-system/jsx"

      function InputStructure() {
        return (
          <styled.div
            css={{ marginBottom: '4' }}
            inputCss={{ color: 'red.200' }}
            wrapperCss={{ display: 'flex' }}
          >
            content
          </styled.div>
        )
      }
    `

    const result = parseAndExtract(code)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .c_red\\.200 {
          color: var(--colors-red-200);
      }

        .d_flex {
          display: flex;
      }

        .mb_4 {
          margin-bottom: var(--spacing-4);
      }
      }"
    `)
  })

  test('should extract *Css prop aliases with array value', () => {
    const code = `
      import { styled } from "styled-system/jsx"

      function Component() {
        return (
          <styled.div
            inputCss={[{ color: 'blue.300' }, { backgroundColor: 'green.300' }]}
          >
            content
          </styled.div>
        )
      }
    `

    const result = parseAndExtract(code)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .c_blue\\.300 {
          color: var(--colors-blue-300);
      }

        .bg-c_green\\.300 {
          background-color: var(--colors-green-300);
      }
      }"
    `)
  })

  test('should handle css and *Css props together', () => {
    const code = `
      import { styled } from "styled-system/jsx"

      function Component() {
        return (
          <styled.div
            css={{ padding: '4' }}
            inputCss={{ color: 'red.200' }}
          >
            content
          </styled.div>
        )
      }
    `

    const result = parseAndExtract(code)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .p_4 {
          padding: var(--spacing-4);
      }

        .c_red\\.200 {
          color: var(--colors-red-200);
      }
      }"
    `)
  })

  test('should extract *Css aliases in minimal mode', () => {
    const code = `
      import { styled } from "styled-system/jsx"

      function Component() {
        return (
          <styled.div
            css={{ padding: '4' }}
            inputCss={{ color: 'red.200' }}
            color="blue"
          >
            content
          </styled.div>
        )
      }
    `

    const result = parseAndExtract(code, { jsxStyleProps: 'minimal' })

    // css and *Css should be extracted, inline style props like color="blue" should NOT
    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .p_4 {
          padding: var(--spacing-4);
      }

        .c_red\\.200 {
          color: var(--colors-red-200);
      }
      }"
    `)
  })

  test('should include *Css props in parser data', () => {
    const code = `
      import { styled } from "styled-system/jsx"

      function Component() {
        return (
          <styled.div inputCss={{ bg: "red.200" }}>content</styled.div>
        )
      }
    `

    const result = jsxParser(code)
    const item = Array.from(result)[0]

    expect(item.data[0]).toHaveProperty('inputCss')
    expect(item.data[0].inputCss).toEqual({ bg: 'red.200' })
  })

  test('should extract compiled react automatic runtime css props', () => {
    const code = `
      import { Fragment, jsx, jsxs } from "react/jsx-runtime"
      import { css, cx } from "styled-system/css"

      const Box = (props) => {
        const { css: cssProp, children } = props
        return jsx("div", {
          className: cx(css(cssProp)),
          children,
        })
      }

      const styles = css.raw({
        color: 'white',
        backgroundColor: 'AntiqueWhite',
      })

      const spreadStyles = css.raw({
        color: 'white',
        backgroundColor: 'SteelBlue',
      })

      export const CustomComponent = () => {
        return jsxs(Fragment, {
          children: [
            jsx(Box, {
              css: {
                color: 'black',
                backgroundColor: 'RebeccaPurple',
              },
              children: "Box",
            }),
            jsx(Box, {
              css: styles,
              children: "Box",
            }),
            jsx(Box, {
              css: {
                ...spreadStyles,
              },
              children: "Box",
            }),
          ],
        })
      }
    `

    const result = parseAndExtract(code, { jsxFramework: 'react' })
    const boxResults = result.json.filter((item) => item.name === 'Box')

    expect(boxResults).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "css": {
                "backgroundColor": "RebeccaPurple",
                "color": "black",
              },
            },
          ],
          "name": "Box",
          "type": "jsx-pattern",
        },
        {
          "data": [
            {
              "css": {
                "backgroundColor": "AntiqueWhite",
                "color": "white",
              },
            },
          ],
          "name": "Box",
          "type": "jsx-pattern",
        },
        {
          "data": [
            {
              "css": {
                "backgroundColor": "SteelBlue",
                "color": "white",
              },
            },
          ],
          "name": "Box",
          "type": "jsx-pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .c_white {
          color: var(--colors-white);
      }

        .bg-c_AntiqueWhite {
          background-color: AntiqueWhite;
      }

        .bg-c_SteelBlue {
          background-color: SteelBlue;
      }

        .c_black {
          color: var(--colors-black);
      }

        .bg-c_RebeccaPurple {
          background-color: RebeccaPurple;
      }
      }"
    `)
  })

  test('should extract bundled react runtime namespace css props', () => {
    const code = `
      var jsxRuntimeExports = requireJsxRuntime()
      function requireJsxRuntime() {
        return { jsx() {}, jsxs() {}, Fragment: "fragment" }
      }
      const styled = { div: "div" }

      const Box = (props) => {
        const { css: cssProp, children } = props
        return jsxRuntimeExports.jsx(styled.div, {
          css: cssProp,
          children,
        })
      }

      const sharedStyles = {
        color: 'white',
        backgroundColor: 'SteelBlue',
      }

      export const App = () => {
        return jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
          children: [
            jsxRuntimeExports.jsx(Box, {
              css: {
                color: 'black',
                backgroundColor: 'RebeccaPurple',
              },
              children: "Box",
            }),
            jsxRuntimeExports.jsx(Box, {
              css: {
                ...sharedStyles,
              },
              children: "Box",
            }),
          ],
        })
      }
    `

    const result = parseAndExtract(code, { jsxFramework: 'react' })
    const boxResults = result.json.filter((item) => item.name === 'Box')

    expect(boxResults).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "css": {
                "backgroundColor": "RebeccaPurple",
                "color": "black",
              },
            },
          ],
          "name": "Box",
          "type": "jsx-pattern",
        },
        {
          "data": [
            {
              "css": {
                "backgroundColor": "SteelBlue",
                "color": "white",
              },
            },
          ],
          "name": "Box",
          "type": "jsx-pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .c_black {
          color: var(--colors-black);
      }

        .bg-c_RebeccaPurple {
          background-color: RebeccaPurple;
      }

        .c_white {
          color: var(--colors-white);
      }

        .bg-c_SteelBlue {
          background-color: SteelBlue;
      }
      }"
    `)
  })

  test('should extract esm namespace react runtime output', () => {
    expectCompiledColorBoxResult(`
      import * as jsxRuntime from "react/jsx-runtime"

      const ColorBox = ({ children }) => {
        return jsxRuntime.jsx("div", {
          children,
        })
      }

      const sharedStyles = {
        color: 'white',
        backgroundColor: 'SteelBlue',
      }

      export const App = () => {
        return jsxRuntime.jsxs(jsxRuntime.Fragment, {
          children: [jsxRuntime.jsx(ColorBox, {
            css: {
              color: 'black',
              backgroundColor: 'RebeccaPurple',
            },
            children: "Inline",
          }), jsxRuntime.jsx(ColorBox, {
            css: {
              ...sharedStyles,
            },
            children: "Spread",
          })],
        })
      }
    `)
  })

  test('should extract esm namespace alias react runtime output', () => {
    expectCompiledColorBoxResult(`
      import * as import_jsx_runtime from "react/jsx-runtime"

      const ColorBox = ({ children }) => {
        return (0, import_jsx_runtime.jsx)("div", { children })
      }

      const sharedStyles = {
        color: 'white',
        backgroundColor: 'SteelBlue',
      }

      export const App = () => {
        return (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, {
          children: [(0, import_jsx_runtime.jsx)(ColorBox, {
            css: {
              color: 'black',
              backgroundColor: 'RebeccaPurple',
            },
            children: "Inline",
          }), (0, import_jsx_runtime.jsx)(ColorBox, {
            css: {
              ...sharedStyles,
            },
            children: "Spread",
          })],
        })
      }
    `)
  })

  test('should extract babel compiled react runtime output', () => {
    expectCompiledColorBoxResult(`
      import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime"

      const ColorBox = ({ children }) => {
        return /*#__PURE__*/_jsx("div", {
          children: children,
        })
      }

      const sharedStyles = {
        color: 'white',
        backgroundColor: 'SteelBlue',
      }

      export const App = () => {
        return /*#__PURE__*/_jsxs(_Fragment, {
          children: [/*#__PURE__*/_jsx(ColorBox, {
            css: {
              color: 'black',
              backgroundColor: 'RebeccaPurple',
            },
            children: "Inline",
          }), /*#__PURE__*/_jsx(ColorBox, {
            css: {
              ...sharedStyles,
            },
            children: "Spread",
          })],
        })
      }
    `)
  })

  test('should extract vite bundled react runtime output', () => {
    expectCompiledColorBoxResult(`
      var jsxRuntimeExports = requireJsxRuntime()

      const ColorBox = ({ children }) => {
        return /*#__PURE__*/ jsxRuntimeExports.jsx("div", {
          children,
        })
      }

      const sharedStyles = {
        color: 'white',
        backgroundColor: 'SteelBlue',
      }

      const App = () => {
        return /*#__PURE__*/ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
          children: [/* @__PURE__ */ jsxRuntimeExports.jsx(ColorBox, {
            css: {
              color: 'black',
              backgroundColor: 'RebeccaPurple',
            },
            children: "Inline",
          }), /* @__PURE__ */ jsxRuntimeExports.jsx(ColorBox, {
            css: {
              ...sharedStyles,
            },
            children: "Spread",
          })],
        })
      }
    `)
  })

  test('should extract webpack bundled react runtime output', () => {
    expectCompiledColorBoxResult(`
      var jsx_runtime = __webpack_require__(848)

      const ColorBox = ({ children }) => {
        return /*#__PURE__*/ (0, jsx_runtime.jsx)("div", {
          children: children,
        })
      }

      const sharedStyles = {
        color: 'white',
        backgroundColor: 'SteelBlue',
      }

      const App = () => {
        return /*#__PURE__*/ (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
          children: [/*#__PURE__*/ (0, jsx_runtime.jsx)(ColorBox, {
            css: {
              color: 'black',
              backgroundColor: 'RebeccaPurple',
            },
            children: "Inline",
          }), /*#__PURE__*/ (0, jsx_runtime.jsx)(ColorBox, {
            css: {
              ...sharedStyles,
            },
            children: "Spread",
          })],
        })
      }
    `)
  })

  test('should extract rspack bundled react runtime output', () => {
    expectCompiledColorBoxResult(`
      var jsx_runtime = __webpack_require__(848)

      const ColorBox = ({ children }) => {
        return /*#__PURE__*/ (0, jsx_runtime.jsx)("div", {
          children: children,
        })
      }

      const sharedStyles = {
        color: 'white',
        backgroundColor: 'SteelBlue',
      }

      const App = () => {
        return /*#__PURE__*/ (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
          children: [/*#__PURE__*/ (0, jsx_runtime.jsx)(ColorBox, {
            css: {
              color: 'black',
              backgroundColor: 'RebeccaPurple',
            },
            children: "Inline",
          }), /*#__PURE__*/ (0, jsx_runtime.jsx)(ColorBox, {
            css: {
              ...sharedStyles,
            },
            children: "Spread",
          })],
        })
      }
    `)
  })

  test('should extract rollup bundled react runtime output', () => {
    expectCompiledColorBoxResult(`
      var jsxRuntimeExports = requireJsxRuntime()

      const ColorBox = ({ children }) => {
        return /*#__PURE__*/ jsxRuntimeExports.jsx("div", {
          children: children,
        })
      }

      const sharedStyles = {
        color: 'white',
        backgroundColor: 'SteelBlue',
      }

      const App = () => {
        return /*#__PURE__*/ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
          children: [/*#__PURE__*/ jsxRuntimeExports.jsx(ColorBox, {
            css: {
              color: 'black',
              backgroundColor: 'RebeccaPurple',
            },
            children: "Inline",
          }), /*#__PURE__*/ jsxRuntimeExports.jsx(ColorBox, {
            css: {
              ...sharedStyles,
            },
            children: "Spread",
          })],
        })
      }
    `)
  })

  test('should extract rolldown bundled react runtime output', () => {
    expectCompiledColorBoxResult(`
      var import_jsx_runtime = (__commonJSMin(((exports, module) => {
        module.exports = require_react_jsx_runtime_development()
      })))()

      const ColorBox = ({ children }) => {
        return /*#__PURE__*/ (0, import_jsx_runtime.jsx)("div", { children })
      }

      const sharedStyles = {
        color: 'white',
        backgroundColor: 'SteelBlue',
      }

      const App = () => {
        return /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/*#__PURE__*/ (0, import_jsx_runtime.jsx)(ColorBox, {
          css: {
            color: 'black',
            backgroundColor: 'RebeccaPurple',
          },
          children: "Inline",
        }), /*#__PURE__*/ (0, import_jsx_runtime.jsx)(ColorBox, {
          css: { ...sharedStyles },
          children: "Spread",
        })] })
      }
    `)
  })

  test('should extract parcel bundled react runtime output', () => {
    expectCompiledColorBoxResult(`
      function $parcel$export() {}
      function parcelRegister() {}
      function parcelRequire() { return {} }

      parcelRegister("1jDou", function(module, exports) {
        $parcel$export(module.exports, "Fragment", () => fragment, (v) => fragment = v)
        $parcel$export(module.exports, "jsx", () => jsx, (v) => jsx = v)
        $parcel$export(module.exports, "jsxs", () => jsxs, (v) => jsxs = v)
      })

      var parcelJsxExports = parcelRequire("1jDou")

      const ColorBox = ({ children }) => {
        return /*#__PURE__*/ (0, parcelJsxExports.jsx)("div", {
          children: children,
        })
      }

      const sharedStyles = {
        color: 'white',
        backgroundColor: 'SteelBlue',
      }

      const App = () => {
        return /*#__PURE__*/ (0, parcelJsxExports.jsxs)((0, parcelJsxExports.Fragment), {
          children: [/*#__PURE__*/ (0, parcelJsxExports.jsx)(ColorBox, {
            css: {
              color: 'black',
              backgroundColor: 'RebeccaPurple',
            },
            children: "Inline",
          }), /*#__PURE__*/ (0, parcelJsxExports.jsx)(ColorBox, {
            css: {
              ...sharedStyles,
            },
            children: "Spread",
          })],
        })
      }
    `)
  })

  test('should extract compiled react classic runtime css props', () => {
    const code = `
      import { styled } from "styled-system/jsx"
      import { css, cx } from "styled-system/css"
      import React from "react"

      const Box = (props) => {
        const { css: cssProp, children } = props
        return <styled.div css={cssProp}>{children}</styled.div>
      }

      export const App = () =>
        React.createElement(Box, {
          css: {
            color: 'black',
            backgroundColor: 'RebeccaPurple',
          },
        })
    `

    const result = parseAndExtract(code, { jsxFramework: 'react' })
    const boxResults = result.json.filter((item) => item.name === 'Box')

    expect(boxResults).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "css": {
                "backgroundColor": "RebeccaPurple",
                "color": "black",
              },
            },
          ],
          "name": "Box",
          "type": "jsx-pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .c_black {
          color: var(--colors-black);
      }

        .bg-c_RebeccaPurple {
          background-color: RebeccaPurple;
      }
      }"
    `)
  })

  test('should extract compiled react jsxDEV runtime css props', () => {
    const code = `
      import { styled } from "styled-system/jsx"
      import { css, cx } from "styled-system/css"
      import { jsxDEV } from "react/jsx-dev-runtime"

      const Box = (props) => {
        const { css: cssProp, children } = props
        return <styled.div css={cssProp}>{children}</styled.div>
      }

      export const App = () =>
        jsxDEV(Box, {
          css: {
            color: 'black',
            backgroundColor: 'RebeccaPurple',
          },
        }, undefined, false, { fileName: "test.tsx", lineNumber: 1, columnNumber: 1 }, this)
    `

    const result = parseAndExtract(code, { jsxFramework: 'react' })
    const boxResults = result.json.filter((item) => item.name === 'Box')

    expect(boxResults).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "css": {
                "backgroundColor": "RebeccaPurple",
                "color": "black",
              },
            },
          ],
          "name": "Box",
          "type": "jsx-pattern",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .c_black {
          color: var(--colors-black);
      }

        .bg-c_RebeccaPurple {
          background-color: RebeccaPurple;
      }
      }"
    `)
  })

  test('should extract compiled preact jsx helper calls', () => {
    const code = `
      import { jsx } from "preact/jsx-runtime"
      import { styled } from "styled-system/jsx"

      export const App = () => jsx(styled.div, {
        css: {
          bg: 'red.200',
        },
      })
    `

    const result = parseAndExtract(code, { jsxFramework: 'preact' })

    expect(result.json).toMatchInlineSnapshot(`
      [
        {
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
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .bg_red\\.200 {
          background: var(--colors-red-200);
      }
      }"
    `)
  })

  test('should extract bundled preact local helper runtime output', () => {
    expectCompiledColorBoxResult(
      `
      var l$1 = {}, f$1 = 0
      function k$1(n2) {
        return n2.children
      }
      function u$1(e2, t2, n2, o2, i2, u2) {
        t2 || (t2 = {})
        var a2, c2, p2 = t2
        if ("ref" in p2) for (c2 in p2 = {}, t2) "ref" == c2 ? a2 = t2[c2] : p2[c2] = t2[c2]
        var l2 = { type: e2, props: p2, key: n2, ref: a2, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: --f$1, __i: -1, __u: 0, __source: i2, __self: u2 }
        if ("function" == typeof e2 && (a2 = e2.defaultProps)) for (c2 in a2) void 0 === p2[c2] && (p2[c2] = a2[c2])
        return l$1.vnode && l$1.vnode(l2), l2
      }

      const ColorBox = (props) => {
        const { css: cssProp, children } = props
        return u$1("div", { css: cssProp, children })
      }

      const sharedStyles = {
        color: 'white',
        backgroundColor: 'SteelBlue',
      }

      const App = () => {
        return u$1(k$1, { children: [
          u$1(ColorBox, {
            css: {
              color: 'black',
              backgroundColor: 'RebeccaPurple',
            },
            children: "Inline",
          }),
          u$1(ColorBox, {
            css: {
              ...sharedStyles,
            },
            children: "Spread",
          }),
        ] })
      }
    `,
      'preact',
    )
  })

  test('should extract babel compiled preact runtime output', () => {
    expectCompiledColorBoxResult(
      `
      import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "preact/jsx-runtime"

      const ColorBox = ({ children }) => {
        return _jsx("div", {
          children: children,
        })
      }

      const sharedStyles = {
        color: 'white',
        backgroundColor: 'SteelBlue',
      }

      export const App = () => {
        return _jsxs(_Fragment, {
          children: [_jsx(ColorBox, {
            css: {
              color: 'black',
              backgroundColor: 'RebeccaPurple',
            },
            children: "Inline",
          }), _jsx(ColorBox, {
            css: {
              ...sharedStyles,
            },
            children: "Spread",
          })],
        })
      }
    `,
      'preact',
    )
  })

  test('should extract webpack bundled preact runtime output', () => {
    expectCompiledColorBoxResult(
      `
      var preact_module_l = {}
      function k() {
        return arguments[0].children
      }
      function jsxRuntime_module_u(e, t, n, o, i, u) {
        t || (t = {})
        var a, c, p = t
        if ("ref" in p) for (c in p = {}, t) "ref" == c ? a = t[c] : p[c] = t[c]
        var l = { type: e, props: p, key: n, ref: a, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: 0, __i: -1, __u: 0, __source: i, __self: u }
        if ("function" == typeof e && (a = e.defaultProps)) for (c in a) void 0 === p[c] && (p[c] = a[c])
        return preact_module_l.vnode && preact_module_l.vnode(l), l
      }

      const ColorBox = ({ children }) => {
        return jsxRuntime_module_u("div", {
          children: children,
        })
      }

      const sharedStyles = {
        color: 'white',
        backgroundColor: 'SteelBlue',
      }

      const App = () => {
        return jsxRuntime_module_u(k, {
          children: [jsxRuntime_module_u(ColorBox, {
            css: {
              color: 'black',
              backgroundColor: 'RebeccaPurple',
            },
            children: "Inline",
          }), jsxRuntime_module_u(ColorBox, {
            css: {
              ...sharedStyles,
            },
            children: "Spread",
          })],
        })
      }
    `,
      'preact',
    )
  })

  test('should extract parcel bundled preact runtime output', () => {
    expectCompiledColorBoxResult(
      `
      function $parcel$export() {}
      let jsxHelper
      let fragmentHelper
      $parcel$export({}, "Fragment", () => fragmentHelper, (v) => fragmentHelper = v)
      $parcel$export({}, "jsx", () => jsxHelper, (v) => jsxHelper = v)

      const parcelJsx = {
        jsx: jsxHelper,
        Fragment: fragmentHelper,
      }

      const ColorBox = ({ children }) => {
        return parcelJsx.jsx("div", {
          children: children,
        })
      }

      const sharedStyles = {
        color: 'white',
        backgroundColor: 'SteelBlue',
      }

      const App = () => {
        return parcelJsx.jsx(parcelJsx.Fragment, {
          children: [
            parcelJsx.jsx(ColorBox, {
              css: {
                color: 'black',
                backgroundColor: 'RebeccaPurple',
              },
              children: "Inline",
            }),
            parcelJsx.jsx(ColorBox, {
              css: {
                ...sharedStyles,
              },
              children: "Spread",
            }),
          ],
        })
      }
    `,
      'preact',
    )
  })

  test('should extract compiled preact jsxDEV helper calls', () => {
    const code = `
      import { jsxDEV } from "preact/jsx-dev-runtime"
      import { styled } from "styled-system/jsx"

      export const App = () => jsxDEV(styled.div, {
        css: {
          bg: 'red.200',
        },
      }, undefined)
    `

    const result = parseAndExtract(code, { jsxFramework: 'preact' })

    expect(result.json).toMatchInlineSnapshot(`
      [
        {
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
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .bg_red\\.200 {
          background: var(--colors-red-200);
      }
      }"
    `)
  })

  test('should extract compiled vue createVNode helper calls', () => {
    const code = `
      import { createVNode } from "vue"
      import { styled } from "styled-system/jsx"

      export const App = () => createVNode(styled.div, {
        css: {
          bg: 'red.200',
        },
      })
    `

    const result = parseAndExtract(code, { jsxFramework: 'vue' })

    expect(result.json).toMatchInlineSnapshot(`
      [
        {
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
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .bg_red\\.200 {
          background: var(--colors-red-200);
      }
      }"
    `)
  })

  test('should extract compiled vue h helper calls', () => {
    const code = `
      import { h } from "vue"
      import { styled } from "styled-system/jsx"

      export const App = () => h(styled.div, {
        css: {
          bg: 'red.200',
        },
      })
    `

    const result = parseAndExtract(code, { jsxFramework: 'vue' })

    expect(result.json).toMatchInlineSnapshot(`
      [
        {
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
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .bg_red\\.200 {
          background: var(--colors-red-200);
      }
      }"
    `)
  })

  test('should extract babel compiled vue runtime output', () => {
    expectCompiledColorBoxResult(
      `
      import { defineComponent, createVNode as _createVNode, Fragment as _Fragment, createTextVNode as _createTextVNode } from "vue"

      const ColorBox = defineComponent((props) => {
        return () => _createVNode("div", null, [props.children])
      })

      const sharedStyles = {
        color: "white",
        backgroundColor: "SteelBlue",
      }

      export const App = defineComponent(() => {
        return () => _createVNode(_Fragment, null, [_createVNode(ColorBox, {
          css: {
            color: "black",
            backgroundColor: "RebeccaPurple",
          },
        }, {
          default: () => [_createTextVNode("Inline")],
        }), _createVNode(ColorBox, {
          css: {
            ...sharedStyles,
          },
        }, {
          default: () => [_createTextVNode("Spread")],
        })])
      })
    `,
      'vue',
    )
  })

  test('should extract vite bundled vue runtime output', () => {
    expectCompiledColorBoxResult(
      `
      function guardReactiveProps(props) { return props }
      function createBaseVNode(type, props = null, children = null, patchFlag = 0, dynamicProps = null, shapeFlag = 0, isBlockNode = false, needFullChildrenNormalization = false) {}
      function _createVNode(type, props = null, children = null, patchFlag = 0, dynamicProps = null, isBlockNode = false) {
        if (props) {
          props = guardReactiveProps(props)
        }
        const shapeFlag = 0
        return createBaseVNode(type, props, children, patchFlag, dynamicProps, shapeFlag, isBlockNode, true)
      }
      const createVNode = createVNodeWithArgsTransform ? createVNodeWithArgsTransform : _createVNode
      const Fragment = Symbol.for("v-fgt")
      const createTextVNode = (value) => value
      const defineComponent = (setup) => setup

      const ColorBox = defineComponent((props) => {
        return () => createVNode("div", null, [props.children])
      })

      const sharedStyles = {
        color: "white",
        backgroundColor: "SteelBlue",
      }

      const App = defineComponent(() => {
        return () => createVNode(Fragment, null, [createVNode(ColorBox, {
          css: {
            color: "black",
            backgroundColor: "RebeccaPurple",
          },
        }, {
          default: () => [createTextVNode("Inline")],
        }), createVNode(ColorBox, {
          css: {
            ...sharedStyles,
          },
        }, {
          default: () => [createTextVNode("Spread")],
        })])
      })
    `,
      'vue',
    )
  })

  test('should extract webpack bundled vue runtime output', () => {
    expectCompiledColorBoxResult(
      `
      function guardReactiveProps(props) { return props }
      function createBaseVNode(type, props = null, children = null, patchFlag = 0, dynamicProps = null, shapeFlag = 0, isBlockNode = false, needFullChildrenNormalization = false) {}
      function _createVNode(type, props = null, children = null, patchFlag = 0, dynamicProps = null, isBlockNode = false) {
        if (props) {
          props = guardReactiveProps(props)
        }
        const shapeFlag = 0
        return createBaseVNode(type, props, children, patchFlag, dynamicProps, shapeFlag, isBlockNode, true)
      }
      const createVNode = false ? 0 : _createVNode
      const Fragment = Symbol.for("v-fgt")
      const createTextVNode = (value) => value
      const defineComponent = (setup) => setup

      const ColorBox = defineComponent((props) => {
        return () => createVNode("div", null, [props.children])
      })

      const sharedStyles = {
        color: "white",
        backgroundColor: "SteelBlue",
      }

      const App = defineComponent(() => {
        return () => createVNode(Fragment, null, [createVNode(ColorBox, {
          css: {
            color: "black",
            backgroundColor: "RebeccaPurple",
          },
        }, {
          default: () => [createTextVNode("Inline")],
        }), createVNode(ColorBox, {
          css: {
            ...sharedStyles,
          },
        }, {
          default: () => [createTextVNode("Spread")],
        })])
      })
    `,
      'vue',
    )
  })

  test('should extract rolldown bundled vue runtime output', () => {
    expectCompiledColorBoxResult(
      `
      function _createVNode(type, props = null, children = null, patchFlag = 0, dynamicProps = null, isBlockNode = false) {
        const shapeFlag = 0
        const vnode = { patchFlag: 0 }
        vnode.patchFlag = -2
        if (type && type.__vccOpts) {
          type = type.__vccOpts
        }
        return { type, props, children, patchFlag, dynamicProps, shapeFlag, isBlockNode }
      }
      function createVNodeWithArgsTransform(...args) {
        return _createVNode(...args)
      }
      const createVNode = createVNodeWithArgsTransform
      const Fragment = Symbol.for("v-fgt")
      const createTextVNode = (value) => value
      const defineComponent = (setup) => setup

      const ColorBox = defineComponent((props) => {
        return () => createVNode("div", null, [props.children])
      })

      const sharedStyles = {
        color: "white",
        backgroundColor: "SteelBlue",
      }

      const App = defineComponent(() => {
        return () => createVNode(Fragment, null, [createVNode(ColorBox, {
          css: {
            color: "black",
            backgroundColor: "RebeccaPurple",
          },
        }, {
          default: () => [createTextVNode("Inline")],
        }), createVNode(ColorBox, {
          css: {
            ...sharedStyles,
          },
        }, {
          default: () => [createTextVNode("Spread")],
        })])
      })
    `,
      'vue',
    )
  })

  test('should extract parcel bundled vue runtime output', () => {
    expectCompiledColorBoxResult(
      `
      const $parcel$createVNode = $parcel$var$_createVNode
      function $parcel$var$_createVNode(type, props = null, children = null, patchFlag = 0, dynamicProps = null, isBlockNode = false) {
        const vnode = { patchFlag: 0 }
        vnode.patchFlag = -2
        if (type && type.__vccOpts) {
          type = type.__vccOpts
        }
        const shapeFlag = 0
        return { type, props, children, patchFlag, dynamicProps, shapeFlag, isBlockNode }
      }
      const $parcel$defineComponent = (setup) => setup
      const $parcel$Fragment = Symbol.for("v-fgt")
      const $parcel$createTextVNode = (value) => value

      const $abc123$var$ColorBox = $parcel$defineComponent((props) => {
        return () => (0, $parcel$createVNode)("div", null, [props.children])
      })

      const $abc123$var$sharedStyles = {
        color: "white",
        backgroundColor: "SteelBlue",
      }

      const App = $parcel$defineComponent(() => {
        return () => (0, $parcel$createVNode)($parcel$Fragment, null, [(0, $parcel$createVNode)($abc123$var$ColorBox, {
          css: {
            color: "black",
            backgroundColor: "RebeccaPurple",
          },
        }, {
          default: () => [$parcel$createTextVNode("Inline")],
        }), (0, $parcel$createVNode)($abc123$var$ColorBox, {
          css: {
            ...$abc123$var$sharedStyles,
          },
        }, {
          default: () => [$parcel$createTextVNode("Spread")],
        })])
      })
    `,
      'vue',
    )
  })

  test('should extract babel compiled solid runtime output', () => {
    expectCompiledColorBoxResult(
      `
      import { template as _$template } from "solid-js/web"
      import { createComponent as _$createComponent } from "solid-js/web"
      import { insert as _$insert } from "solid-js/web"

      var _tmpl$ = _$template("<div>")

      const ColorBox = (props) => {
        return (() => {
          const _el$ = _tmpl$.cloneNode(true)
          _$insert(_el$, () => props.children)
          return _el$
        })()
      }

      const sharedStyles = {
        color: "white",
        backgroundColor: "SteelBlue",
      }

      export const App = () => {
        return [_$createComponent(ColorBox, {
          css: {
            color: "black",
            backgroundColor: "RebeccaPurple",
          },
          children: "Inline",
        }), _$createComponent(ColorBox, {
          css: {
            ...sharedStyles,
          },
          children: "Spread",
        })]
      }
    `,
      'solid',
    )
  })

  test('should extract vite bundled solid runtime output', () => {
    expectCompiledColorBoxResult(
      `
      function untrack(fn) {
        return fn()
      }
      function createComponent(Comp, props) {
        return untrack(() => Comp(props || {}))
      }
      function template(html, isImportNode, isSVG, isMathML) {}
      function insert(parent, accessor, marker, initial) {}

      var _tmpl$ = template("<div>")

      const ColorBox = (props) => {
        return (() => {
          const _el$ = _tmpl$.cloneNode(true)
          insert(_el$, () => props.children)
          return _el$
        })()
      }

      const sharedStyles = {
        color: "white",
        backgroundColor: "SteelBlue",
      }

      const App = () => {
        return [createComponent(ColorBox, {
          css: {
            color: "black",
            backgroundColor: "RebeccaPurple",
          },
          children: "Inline",
        }), createComponent(ColorBox, {
          css: {
            ...sharedStyles,
          },
          children: "Spread",
        })]
      }
    `,
      'solid',
    )
  })

  test('should extract webpack bundled solid runtime output', () => {
    expectCompiledColorBoxResult(
      `
      let hydrationEnabled = false
      const sharedConfig = {}
      function setHydrateContext() {}
      function nextHydrateContext() {}
      function untrack(fn) {
        return fn()
      }
      function createComponent(Comp, props) {
        if (hydrationEnabled) {
          if (sharedConfig.context) {
            const c = sharedConfig.context
            setHydrateContext(nextHydrateContext())
            const r = untrack(() => Comp(props || {}))
            setHydrateContext(c)
            return r
          }
        }
        return untrack(() => Comp(props || {}))
      }
      function insert(parent, accessor, marker, initial) {}
      function template(html, isImportNode, isSVG, isMathML) {}

      var _tmpl$ = template("<div>")

      const ColorBox = (props) => {
        return (() => {
          const _el$ = _tmpl$.cloneNode(true)
          insert(_el$, () => props.children)
          return _el$
        })()
      }

      const sharedStyles = {
        color: "white",
        backgroundColor: "SteelBlue",
      }

      const App = () => {
        return [createComponent(ColorBox, {
          css: {
            color: "black",
            backgroundColor: "RebeccaPurple",
          },
          children: "Inline",
        }), createComponent(ColorBox, {
          css: {
            ...sharedStyles,
          },
          children: "Spread",
        })]
      }
    `,
      'solid',
    )
  })

  test('should extract rolldown bundled solid runtime output', () => {
    expectCompiledColorBoxResult(
      `
      function untrack(fn) {
        return fn()
      }
      function createComponent(Comp, props) {
        return untrack(() => Comp(props || {}))
      }
      function template(html, isImportNode, isSVG, isMathML) {}
      function insert(parent, accessor, marker, initial) {}

      var _tmpl$ = template("<div>")

      const ColorBox = (props) => {
        return (() => {
          const _el$ = _tmpl$.cloneNode(true)
          insert(_el$, () => props.children)
          return _el$
        })()
      }

      const sharedStyles = {
        color: "white",
        backgroundColor: "SteelBlue",
      }

      const App = () => {
        return [createComponent(ColorBox, {
          css: {
            color: "black",
            backgroundColor: "RebeccaPurple",
          },
          children: "Inline",
        }), createComponent(ColorBox, {
          css: {
            ...sharedStyles,
          },
          children: "Spread",
        })]
      }
    `,
      'solid',
    )
  })

  test('should extract compiled solid createComponent helper calls', () => {
    const code = `
      import { createComponent } from "solid-js/web"
      import { styled } from "styled-system/jsx"

      export const App = () => createComponent(styled.div, {
        css: {
          bg: 'red.200',
        },
      })
    `

    const result = parseAndExtract(code, { jsxFramework: 'solid' })

    expect(result.json).toMatchInlineSnapshot(`
      [
        {
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
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .bg_red\\.200 {
          background: var(--colors-red-200);
      }
      }"
    `)
  })

  test('should extract compiled qwik _jsxC helper calls', () => {
    const code = `
      import { _jsxC } from "@builder.io/qwik/jsx-runtime"
      import { styled } from "styled-system/jsx"

      export const App = () => _jsxC(styled.div, {
        css: {
          bg: 'red.200',
        },
      }, 0, null)
    `

    const result = parseAndExtract(code, { jsxFramework: 'qwik' })

    expect(result.json).toMatchInlineSnapshot(`
      [
        {
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
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .bg_red\\.200 {
          background: var(--colors-red-200);
      }
      }"
    `)
  })

  test('should extract mergeProps-wrapped compiled props', () => {
    const code = `
      import { createVNode, mergeProps } from "vue"
      import { styled } from "styled-system/jsx"

      export const App = () => createVNode(styled.div, mergeProps(
        {
          css: {
            bg: 'red.200',
          },
        },
        {
          color: 'black',
        },
      ))
    `

    const result = parseAndExtract(code, { jsxFramework: 'vue' })

    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "color": "black",
              "css": {
                "bg": "red.200",
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
        .bg_red\\.200 {
          background: var(--colors-red-200);
      }

        .c_black {
          color: var(--colors-black);
      }
      }"
    `)
  })
})
