import { createContext } from '@pandacss/fixture'
import { describe, expect, test } from 'vitest'
import { generateThemesSpec } from '../src/spec/themes'

describe('generateThemesSpec', () => {
  test('should return undefined when no themes are configured', () => {
    const ctx = createContext({
      eject: true,
      theme: {
        tokens: {
          colors: { red: { value: '#ff0000' } },
        },
      },
    })

    expect(generateThemesSpec(ctx)).toBeUndefined()
  })

  test('should generate spec for themes with tokens', () => {
    const ctx = createContext({
      eject: true,
      theme: {
        tokens: {
          colors: {
            red: { value: '#ff0000' },
            blue: { value: '#0000ff' },
          },
        },
      },
      themes: {
        dark: {
          tokens: {
            colors: {
              red: { value: '#cc0000' },
              blue: { value: '#0000cc' },
            },
          },
        },
      },
    })

    const spec = generateThemesSpec(ctx)

    expect(spec).toMatchInlineSnapshot(`
      {
        "data": [
          {
            "name": "dark",
            "semanticTokens": [],
            "tokens": [
              {
                "functionExamples": [
                  "css({ color: 'red' })",
                ],
                "jsxExamples": [
                  "<Box color="red" />",
                ],
                "tokenFunctionExamples": [
                  "token('colors.red')",
                  "token.var('colors.red')",
                ],
                "type": "colors",
                "values": [
                  {
                    "cssVar": "var(--colors-red)",
                    "deprecated": undefined,
                    "description": undefined,
                    "name": "red",
                    "values": [
                      {
                        "condition": "dark",
                        "value": "#cc0000",
                      },
                    ],
                  },
                  {
                    "cssVar": "var(--colors-blue)",
                    "deprecated": undefined,
                    "description": undefined,
                    "name": "blue",
                    "values": [
                      {
                        "condition": "dark",
                        "value": "#0000cc",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        "type": "themes",
      }
    `)
  })

  test('should generate spec for themes with semantic tokens', () => {
    const ctx = createContext({
      eject: true,
      theme: {
        tokens: {
          colors: {
            red: { value: '#ff0000' },
            blue: { value: '#0000ff' },
          },
        },
        semanticTokens: {
          colors: {
            primary: { value: '{colors.blue}' },
          },
        },
      },
      themes: {
        dark: {
          semanticTokens: {
            colors: {
              primary: { value: '{colors.red}' },
            },
          },
        },
      },
    })

    const spec = generateThemesSpec(ctx)

    expect(spec).toMatchInlineSnapshot(`
      {
        "data": [
          {
            "name": "dark",
            "semanticTokens": [
              {
                "functionExamples": [
                  "css({ color: 'primary' })",
                ],
                "jsxExamples": [
                  "<Box color="primary" />",
                ],
                "tokenFunctionExamples": [
                  "token('colors.primary')",
                  "token.var('colors.primary')",
                ],
                "type": "colors",
                "values": [
                  {
                    "cssVar": "var(--colors-primary)",
                    "deprecated": undefined,
                    "description": undefined,
                    "name": "primary",
                    "values": [
                      {
                        "condition": "dark",
                        "value": "{colors.red}",
                      },
                    ],
                  },
                ],
              },
            ],
            "tokens": [],
          },
        ],
        "type": "themes",
      }
    `)
  })

  test('should generate spec for multiple themes', () => {
    const ctx = createContext({
      eject: true,
      theme: {
        tokens: {
          colors: {
            red: { value: '#ff0000' },
            blue: { value: '#0000ff' },
          },
        },
      },
      themes: {
        dark: {
          tokens: {
            colors: {
              red: { value: '#cc0000' },
            },
          },
        },
        brand: {
          tokens: {
            colors: {
              red: { value: '#ee0000' },
            },
          },
        },
      },
    })

    const spec = generateThemesSpec(ctx)

    expect(spec!.data.map((t) => t.name)).toMatchInlineSnapshot(`
      [
        "dark",
        "brand",
      ]
    `)

    expect(spec!.data.find((t) => t.name === 'dark')!.tokens).toMatchInlineSnapshot(`
      [
        {
          "functionExamples": [
            "css({ color: 'red' })",
          ],
          "jsxExamples": [
            "<Box color="red" />",
          ],
          "tokenFunctionExamples": [
            "token('colors.red')",
            "token.var('colors.red')",
          ],
          "type": "colors",
          "values": [
            {
              "cssVar": "var(--colors-red)",
              "deprecated": undefined,
              "description": undefined,
              "name": "red",
              "values": [
                {
                  "condition": "dark",
                  "value": "#cc0000",
                },
              ],
            },
          ],
        },
      ]
    `)

    expect(spec!.data.find((t) => t.name === 'brand')!.tokens).toMatchInlineSnapshot(`
      [
        {
          "functionExamples": [
            "css({ color: 'red' })",
          ],
          "jsxExamples": [
            "<Box color="red" />",
          ],
          "tokenFunctionExamples": [
            "token('colors.red')",
            "token.var('colors.red')",
          ],
          "type": "colors",
          "values": [
            {
              "cssVar": "var(--colors-red)",
              "deprecated": undefined,
              "description": undefined,
              "name": "red",
              "values": [
                {
                  "condition": "brand",
                  "value": "#ee0000",
                },
              ],
            },
          ],
        },
      ]
    `)
  })

  test('should generate spec with both tokens and semantic tokens in a theme', () => {
    const ctx = createContext({
      eject: true,
      theme: {
        tokens: {
          colors: {
            red: { value: '#ff0000' },
            blue: { value: '#0000ff' },
          },
        },
        semanticTokens: {
          colors: {
            primary: { value: '{colors.blue}' },
          },
        },
      },
      themes: {
        dark: {
          tokens: {
            colors: {
              red: { value: '#cc0000' },
            },
          },
          semanticTokens: {
            colors: {
              primary: { value: '{colors.red}' },
            },
          },
        },
      },
    })

    const spec = generateThemesSpec(ctx)
    const dark = spec!.data[0]

    expect(dark.tokens.map((g) => ({ type: g.type, count: g.values.length }))).toMatchInlineSnapshot(`
      [
        {
          "count": 1,
          "type": "colors",
        },
      ]
    `)

    expect(dark.semanticTokens.map((g) => ({ type: g.type, count: g.values.length }))).toMatchInlineSnapshot(`
      [
        {
          "count": 1,
          "type": "colors",
        },
      ]
    `)
  })

  test('should be included in getSpec output', () => {
    const ctx = createContext({
      eject: true,
      theme: {
        tokens: {
          colors: {
            red: { value: '#ff0000' },
          },
        },
      },
      themes: {
        dark: {
          tokens: {
            colors: {
              red: { value: '#cc0000' },
            },
          },
        },
      },
    })

    const specs = ctx.getSpec()
    const themesSpec = specs.find((s) => s.type === 'themes')
    expect(themesSpec!.type).toBe('themes')
  })
})
