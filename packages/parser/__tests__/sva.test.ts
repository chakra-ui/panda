import { describe, expect, test } from 'vitest'
import { parseAndExtract, svaParser } from './fixture'

describe('ast parser / sva', () => {
  test('should parse', () => {
    const code = `
    import {sva} from "styled-system/css"

    const button = sva({
        slots: ['label', 'icon'],
        base: {
            label: {
            color: 'red',
            },
            icon: {
            fontSize: 'lg',
            },
        },
    })
     `

    expect(svaParser(code)).toMatchInlineSnapshot(`
      {
        "sva": Set {
          {
            "box": {
              "column": 20,
              "line": 4,
              "node": "CallExpression",
              "type": "map",
              "value": Map {
                "slots" => {
                  "column": 16,
                  "line": 5,
                  "node": "ArrayLiteralExpression",
                  "type": "array",
                  "value": [
                    {
                      "column": 17,
                      "line": 5,
                      "node": "StringLiteral",
                      "type": "literal",
                      "value": "label",
                    },
                    {
                      "column": 26,
                      "line": 5,
                      "node": "StringLiteral",
                      "type": "literal",
                      "value": "icon",
                    },
                  ],
                },
                "base" => {
                  "column": 15,
                  "line": 6,
                  "node": "ObjectLiteralExpression",
                  "type": "map",
                  "value": Map {
                    "label" => {
                      "column": 20,
                      "line": 7,
                      "node": "ObjectLiteralExpression",
                      "type": "map",
                      "value": Map {
                        "color" => {
                          "column": 20,
                          "line": 8,
                          "node": "StringLiteral",
                          "type": "literal",
                          "value": "red",
                        },
                      },
                    },
                    "icon" => {
                      "column": 19,
                      "line": 10,
                      "node": "ObjectLiteralExpression",
                      "type": "map",
                      "value": Map {
                        "fontSize" => {
                          "column": 23,
                          "line": 11,
                          "node": "StringLiteral",
                          "type": "literal",
                          "value": "lg",
                        },
                      },
                    },
                  },
                },
              },
            },
            "data": [
              {
                "base": {
                  "icon": {
                    "fontSize": "lg",
                  },
                  "label": {
                    "color": "red",
                  },
                },
                "slots": [
                  "label",
                  "icon",
                ],
              },
            ],
            "name": "sva",
            "type": "sva",
          },
        },
      }
    `)
  })

  test('unresolvable slots', () => {
    const code = `
    import { sva } from 'styled-system/css'
    import { slots } from './slots'

    const card = sva({
      slots,
      base: {
        root: {
          p: '6',
          m: '4',
          w: 'md',
          boxShadow: 'md',
          borderRadius: 'md',
          _dark: { bg: '#262626', color: 'white' },
        },
        content: {
          textStyle: 'lg',
        },
        title: {
          textStyle: 'xl',
          fontWeight: 'semibold',
          pb: '2',
        },
      },
    })
     `
    const result = parseAndExtract(code)
    expect(result.json).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "base": {
                "content": {
                  "textStyle": "lg",
                },
                "root": {
                  "_dark": {
                    "bg": "#262626",
                    "color": "white",
                  },
                  "borderRadius": "md",
                  "boxShadow": "md",
                  "m": "4",
                  "p": "6",
                  "w": "md",
                },
                "title": {
                  "fontWeight": "semibold",
                  "pb": "2",
                  "textStyle": "xl",
                },
              },
              "slots": [
                "root",
                "content",
                "title",
              ],
            },
          ],
          "name": "sva",
          "type": "sva",
        },
      ]
    `)

    expect(result.css).toMatchInlineSnapshot(`
      "@layer utilities {
        .p_6 {
          padding: var(--spacing-6);
      }

        .m_4 {
          margin: var(--spacing-4);
      }

        .w_md {
          width: var(--sizes-md);
      }

        .shadow_md {
          box-shadow: var(--shadows-md);
      }

        .rounded_md {
          border-radius: var(--radii-md);
      }

        .fw_semibold {
          font-weight: var(--font-weights-semibold);
      }

        .pb_2 {
          padding-bottom: var(--spacing-2);
      }

        [data-theme=dark] .dark\\:bg_\\#262626,.dark .dark\\:bg_\\#262626,.dark\\:bg_\\#262626.dark,.dark\\:bg_\\#262626[data-theme=dark] {
          background: #262626;
      }

        [data-theme=dark] .dark\\:text_white,.dark .dark\\:text_white,.dark\\:text_white.dark,.dark\\:text_white[data-theme=dark] {
          color: var(--colors-white);
      }
      }"
    `)
  })
})
