import { describe, test, expect } from 'vitest'
import { cssParser, parseAndExtract } from './fixture'

describe('ast parser', () => {
  test('[without import] should not parse', () => {
    const code = `
        const baseStyle = css({
            color: 'red',
            fontSize: '12px',
        })

        const testStyle = css({
          bg: "red.300",
          margin: { xs: "0", lg:"40px" },
          padding: [12, 50]
        })
     `

    expect(cssParser(code)).toMatchInlineSnapshot(`
      {
        "css": Set {
          {
            "box": {
              "column": 27,
              "line": 2,
              "node": "CallExpression",
              "type": "map",
              "value": Map {
                "color" => {
                  "column": 20,
                  "line": 3,
                  "node": "StringLiteral",
                  "type": "literal",
                  "value": "red",
                },
                "fontSize" => {
                  "column": 23,
                  "line": 4,
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
            "type": "object",
          },
          {
            "box": {
              "column": 27,
              "line": 7,
              "node": "CallExpression",
              "type": "map",
              "value": Map {
                "bg" => {
                  "column": 15,
                  "line": 8,
                  "node": "StringLiteral",
                  "type": "literal",
                  "value": "red.300",
                },
                "margin" => {
                  "column": 19,
                  "line": 9,
                  "node": "ObjectLiteralExpression",
                  "type": "map",
                  "value": Map {
                    "xs" => {
                      "column": 25,
                      "line": 9,
                      "node": "StringLiteral",
                      "type": "literal",
                      "value": "0",
                    },
                    "lg" => {
                      "column": 33,
                      "line": 9,
                      "node": "StringLiteral",
                      "type": "literal",
                      "value": "40px",
                    },
                  },
                },
                "padding" => {
                  "column": 20,
                  "line": 10,
                  "node": "ArrayLiteralExpression",
                  "type": "array",
                  "value": [
                    {
                      "column": 21,
                      "line": 10,
                      "node": "NumericLiteral",
                      "type": "literal",
                      "value": 12,
                    },
                    {
                      "column": 25,
                      "line": 10,
                      "node": "NumericLiteral",
                      "type": "literal",
                      "value": 50,
                    },
                  ],
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
                "padding": [
                  12,
                  50,
                ],
              },
            ],
            "name": "css",
            "type": "object",
          },
        },
      }
    `)
  })

  test('[with import] should parse static property', () => {
    const code = `
    import {css} from "styled-system/css";
        const baseStyle = css({
            color: 'red',
            fontSize: '12px',
        })

        const testStyle = css({
          bg: "red.300",
          margin: { xs: "0", lg:"40px" },
          padding: [12, 50]
        })
     `

    expect(cssParser(code)).toMatchInlineSnapshot(`
      {
        "css": Set {
          {
            "box": {
              "column": 27,
              "line": 3,
              "node": "CallExpression",
              "type": "map",
              "value": Map {
                "color" => {
                  "column": 20,
                  "line": 4,
                  "node": "StringLiteral",
                  "type": "literal",
                  "value": "red",
                },
                "fontSize" => {
                  "column": 23,
                  "line": 5,
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
            "type": "object",
          },
          {
            "box": {
              "column": 27,
              "line": 8,
              "node": "CallExpression",
              "type": "map",
              "value": Map {
                "bg" => {
                  "column": 15,
                  "line": 9,
                  "node": "StringLiteral",
                  "type": "literal",
                  "value": "red.300",
                },
                "margin" => {
                  "column": 19,
                  "line": 10,
                  "node": "ObjectLiteralExpression",
                  "type": "map",
                  "value": Map {
                    "xs" => {
                      "column": 25,
                      "line": 10,
                      "node": "StringLiteral",
                      "type": "literal",
                      "value": "0",
                    },
                    "lg" => {
                      "column": 33,
                      "line": 10,
                      "node": "StringLiteral",
                      "type": "literal",
                      "value": "40px",
                    },
                  },
                },
                "padding" => {
                  "column": 20,
                  "line": 11,
                  "node": "ArrayLiteralExpression",
                  "type": "array",
                  "value": [
                    {
                      "column": 21,
                      "line": 11,
                      "node": "NumericLiteral",
                      "type": "literal",
                      "value": 12,
                    },
                    {
                      "column": 25,
                      "line": 11,
                      "node": "NumericLiteral",
                      "type": "literal",
                      "value": 50,
                    },
                  ],
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
                "padding": [
                  12,
                  50,
                ],
              },
            ],
            "name": "css",
            "type": "object",
          },
        },
      }
    `)
  })

  test('[with import alias] should parse static property', () => {
    const code = `
    import {css as nCss} from "styled-system/css";
        const baseStyle = nCss({
            color: 'red',
            fontSize: '12px',
        })

        const testStyle = nCss({
          bg: "red.300",
          margin: { xs: "0", lg:"40px" },
          padding: [12, 50]
        })
     `

    expect(cssParser(code)).toMatchInlineSnapshot(`
      {
        "css": Set {
          {
            "box": {
              "column": 27,
              "line": 3,
              "node": "CallExpression",
              "type": "map",
              "value": Map {
                "color" => {
                  "column": 20,
                  "line": 4,
                  "node": "StringLiteral",
                  "type": "literal",
                  "value": "red",
                },
                "fontSize" => {
                  "column": 23,
                  "line": 5,
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
            "type": "object",
          },
          {
            "box": {
              "column": 27,
              "line": 8,
              "node": "CallExpression",
              "type": "map",
              "value": Map {
                "bg" => {
                  "column": 15,
                  "line": 9,
                  "node": "StringLiteral",
                  "type": "literal",
                  "value": "red.300",
                },
                "margin" => {
                  "column": 19,
                  "line": 10,
                  "node": "ObjectLiteralExpression",
                  "type": "map",
                  "value": Map {
                    "xs" => {
                      "column": 25,
                      "line": 10,
                      "node": "StringLiteral",
                      "type": "literal",
                      "value": "0",
                    },
                    "lg" => {
                      "column": 33,
                      "line": 10,
                      "node": "StringLiteral",
                      "type": "literal",
                      "value": "40px",
                    },
                  },
                },
                "padding" => {
                  "column": 20,
                  "line": 11,
                  "node": "ArrayLiteralExpression",
                  "type": "array",
                  "value": [
                    {
                      "column": 21,
                      "line": 11,
                      "node": "NumericLiteral",
                      "type": "literal",
                      "value": 12,
                    },
                    {
                      "column": 25,
                      "line": 11,
                      "node": "NumericLiteral",
                      "type": "literal",
                      "value": 50,
                    },
                  ],
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
                "padding": [
                  12,
                  50,
                ],
              },
            ],
            "name": "css",
            "type": "object",
          },
        },
      }
    `)
  })

  test('should extract nested css', () => {
    const code = `
      import { css } from 'styled-system/css'

console.log(
  console.log(
    css({
      selectors: {
        '&:hover': {
          background: 'red.200',
        },
      },
    }),
  ),
)
`

    expect(cssParser(code)).toMatchInlineSnapshot(`
      {
        "css": Set {
          {
            "box": {
              "column": 5,
              "line": 6,
              "node": "CallExpression",
              "type": "map",
              "value": Map {
                "selectors" => {
                  "column": 18,
                  "line": 7,
                  "node": "ObjectLiteralExpression",
                  "type": "map",
                  "value": Map {
                    "&:hover" => {
                      "column": 20,
                      "line": 8,
                      "node": "ObjectLiteralExpression",
                      "type": "map",
                      "value": Map {
                        "background" => {
                          "column": 23,
                          "line": 9,
                          "node": "StringLiteral",
                          "type": "literal",
                          "value": "red.200",
                        },
                      },
                    },
                  },
                },
              },
            },
            "data": [
              {
                "selectors": {
                  "&:hover": {
                    "background": "red.200",
                  },
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

  test('should extract complex setup', () => {
    const code = `
      import { css, cx } from 'styled-system/css'
import React from 'react'

export function Card({ className }) {
  return (
    <div className={cx('card', css({ background: 'white' }), className)}>
      <div></div>
    </div>
  )
}

      `
    expect(cssParser(code)).toMatchInlineSnapshot(`
      {
        "css": Set {
          {
            "box": {
              "column": 32,
              "line": 7,
              "node": "CallExpression",
              "type": "map",
              "value": Map {
                "background" => {
                  "column": 50,
                  "line": 7,
                  "node": "StringLiteral",
                  "type": "literal",
                  "value": "white",
                },
              },
            },
            "data": [
              {
                "background": "white",
              },
            ],
            "name": "css",
            "type": "object",
          },
        },
      }
    `)
  })

  test('issue #1022: should extract css when using spread syntax on the child', () => {
    const result = parseAndExtract(
      `import { css } from '../styled-system/jsx';

      const meta: MetaProps = {
        title: 'hello world:',
      };

      export const App = () => {
        return (
          <div
            className={css({
              color: 'red.400',
              maxW: '1000px',
            })}
          >
            <Meta {...meta} />
          </div>
        );
      };

      type MetaProps = {
        title: string;
      };
      const Meta: React.FC<MetaProps> = ({ title }) => {
        return <div>{title}</div>;
      };
      `,
    )

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .text_red\\\\.400 {
          color: var(--colors-red-400)
      }

        .max-w_1000px {
          max-width: 1000px
      }
      }"
    `)
  })
})
