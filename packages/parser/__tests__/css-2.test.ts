import { describe, test, expect } from 'vitest'
import { cssParser } from './fixture'

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
                "padding" => {
                  "node": "ArrayLiteralExpression",
                  "stack": [
                    "CallExpression",
                    "ObjectLiteralExpression",
                    "PropertyAssignment",
                    "ArrayLiteralExpression",
                  ],
                  "type": "array",
                  "value": [
                    {
                      "node": "NumericLiteral",
                      "stack": [
                        "CallExpression",
                        "ObjectLiteralExpression",
                        "PropertyAssignment",
                        "ArrayLiteralExpression",
                      ],
                      "type": "literal",
                      "value": 12,
                    },
                    {
                      "node": "NumericLiteral",
                      "stack": [
                        "CallExpression",
                        "ObjectLiteralExpression",
                        "PropertyAssignment",
                        "ArrayLiteralExpression",
                      ],
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
    import {css} from ".panda/css";
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
                "padding" => {
                  "node": "ArrayLiteralExpression",
                  "stack": [
                    "CallExpression",
                    "ObjectLiteralExpression",
                    "PropertyAssignment",
                    "ArrayLiteralExpression",
                  ],
                  "type": "array",
                  "value": [
                    {
                      "node": "NumericLiteral",
                      "stack": [
                        "CallExpression",
                        "ObjectLiteralExpression",
                        "PropertyAssignment",
                        "ArrayLiteralExpression",
                      ],
                      "type": "literal",
                      "value": 12,
                    },
                    {
                      "node": "NumericLiteral",
                      "stack": [
                        "CallExpression",
                        "ObjectLiteralExpression",
                        "PropertyAssignment",
                        "ArrayLiteralExpression",
                      ],
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
    import {css as nCss} from ".panda/css";
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
                "padding" => {
                  "node": "ArrayLiteralExpression",
                  "stack": [
                    "CallExpression",
                    "ObjectLiteralExpression",
                    "PropertyAssignment",
                    "ArrayLiteralExpression",
                  ],
                  "type": "array",
                  "value": [
                    {
                      "node": "NumericLiteral",
                      "stack": [
                        "CallExpression",
                        "ObjectLiteralExpression",
                        "PropertyAssignment",
                        "ArrayLiteralExpression",
                      ],
                      "type": "literal",
                      "value": 12,
                    },
                    {
                      "node": "NumericLiteral",
                      "stack": [
                        "CallExpression",
                        "ObjectLiteralExpression",
                        "PropertyAssignment",
                        "ArrayLiteralExpression",
                      ],
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
      import { css } from '.panda/css'

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
              "node": "CallExpression",
              "stack": [
                "CallExpression",
                "ObjectLiteralExpression",
              ],
              "type": "map",
              "value": Map {
                "selectors" => {
                  "node": "ObjectLiteralExpression",
                  "stack": [
                    "CallExpression",
                    "ObjectLiteralExpression",
                    "PropertyAssignment",
                    "ObjectLiteralExpression",
                  ],
                  "type": "map",
                  "value": Map {
                    "&:hover" => {
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
                            "StringLiteral",
                          ],
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
      import { css, cx } from '.panda/css'
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
              "node": "CallExpression",
              "stack": [
                "CallExpression",
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
                    "StringLiteral",
                  ],
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
})
