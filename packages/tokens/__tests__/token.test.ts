import { describe, expect, test } from 'vitest'
import { TokenMap } from '../src/token-map'

describe('tokens / basic', () => {
  test('simple', () => {
    const dict = new TokenMap({
      tokens: {
        colors: {
          current: { value: 'currentColor' },
          gray: {
            '50': { value: '#FAFAFA' },
            '100': { value: '#F5F5F5' },
          },
        },
      },
    })

    expect(dict.categoryMap).toMatchInlineSnapshot(`
      Map {
        "colors" => Map {
          "current" => {
            "category": "colors",
            "condition": "",
            "description": "",
            "key": "current",
            "negative": false,
            "path": [
              "current",
            ],
            "prop": "colors.current",
            "semantic": false,
            "value": "currentColor",
            "var": "--colors-current",
            "varRef": "var(--colors-current)",
          },
          "gray.50" => {
            "category": "colors",
            "condition": "",
            "description": "",
            "key": "gray.50",
            "negative": false,
            "path": [
              "gray",
              "50",
            ],
            "prop": "colors.gray.50",
            "semantic": false,
            "value": "#FAFAFA",
            "var": "--colors-gray-50",
            "varRef": "var(--colors-gray-50)",
          },
          "gray.100" => {
            "category": "colors",
            "condition": "",
            "description": "",
            "key": "gray.100",
            "negative": false,
            "path": [
              "gray",
              "100",
            ],
            "prop": "colors.gray.100",
            "semantic": false,
            "value": "#F5F5F5",
            "var": "--colors-gray-100",
            "varRef": "var(--colors-gray-100)",
          },
        },
      }
    `)

    expect(dict.values).toMatchInlineSnapshot(`
      Map {
        "colors.current" => {
          "category": "colors",
          "condition": "",
          "description": "",
          "key": "current",
          "negative": false,
          "path": [
            "current",
          ],
          "prop": "colors.current",
          "semantic": false,
          "value": "currentColor",
          "var": "--colors-current",
          "varRef": "var(--colors-current)",
        },
        "colors.gray.50" => {
          "category": "colors",
          "condition": "",
          "description": "",
          "key": "gray.50",
          "negative": false,
          "path": [
            "gray",
            "50",
          ],
          "prop": "colors.gray.50",
          "semantic": false,
          "value": "#FAFAFA",
          "var": "--colors-gray-50",
          "varRef": "var(--colors-gray-50)",
        },
        "colors.gray.100" => {
          "category": "colors",
          "condition": "",
          "description": "",
          "key": "gray.100",
          "negative": false,
          "path": [
            "gray",
            "100",
          ],
          "prop": "colors.gray.100",
          "semantic": false,
          "value": "#F5F5F5",
          "var": "--colors-gray-100",
          "varRef": "var(--colors-gray-100)",
        },
      }
    `)

    expect(dict.vars).toMatchInlineSnapshot(`
      Map {
        "--colors-current" => "currentColor",
        "--colors-gray-50" => "#FAFAFA",
        "--colors-gray-100" => "#F5F5F5",
      }
    `)
  })

  test('with negative spacing', () => {
    const dict = new TokenMap({
      tokens: {
        spacing: {
          sm: { value: '0.5rem' },
        },
      },
    })

    expect(dict.values).toMatchInlineSnapshot(`
      Map {
        "spacing.sm" => {
          "category": "spacing",
          "condition": "",
          "description": "",
          "key": "sm",
          "negative": false,
          "path": [
            "sm",
          ],
          "prop": "spacing.sm",
          "semantic": false,
          "value": "0.5rem",
          "var": "--spacing-sm",
          "varRef": "var(--spacing-sm)",
        },
        "spacing.-sm" => {
          "category": "spacing",
          "condition": "",
          "description": "",
          "key": "-sm",
          "negative": true,
          "path": [
            "-sm",
          ],
          "prop": "spacing.-sm",
          "semantic": false,
          "value": "-0.5rem",
          "var": "--spacing-sm",
          "varRef": "calc(var(--spacing-sm) * -1)",
        },
      }
    `)

    expect(dict.vars).toMatchInlineSnapshot(`
      Map {
        "--spacing-sm" => "0.5rem",
      }
    `)
  })

  test('with nested', () => {
    const dict = new TokenMap({
      tokens: {
        spacing: {
          card: {
            inner: {
              value: '1rem',
            },
          },
        },
      },
    })

    expect(dict.values).toMatchInlineSnapshot(`
      Map {
        "spacing.card.inner" => {
          "category": "spacing",
          "condition": "",
          "description": "",
          "key": "card.inner",
          "negative": false,
          "path": [
            "card",
            "inner",
          ],
          "prop": "spacing.card.inner",
          "semantic": false,
          "value": "1rem",
          "var": "--spacing-card-inner",
          "varRef": "var(--spacing-card-inner)",
        },
        "spacing.card.-inner" => {
          "category": "spacing",
          "condition": "",
          "description": "",
          "key": "card.-inner",
          "negative": true,
          "path": [
            "card",
            "-inner",
          ],
          "prop": "spacing.card.-inner",
          "semantic": false,
          "value": "-1rem",
          "var": "--spacing-card-inner",
          "varRef": "calc(var(--spacing-card-inner) * -1)",
        },
      }
    `)

    expect(dict.vars).toMatchInlineSnapshot(`
      Map {
        "--spacing-card-inner" => "1rem",
      }
    `)
  })
})

describe('tokens / composite', () => {
  test('shadows - basic', () => {
    const dict = new TokenMap({
      tokens: {
        shadows: {
          xs: { value: '0 0 0 1px rgba(0, 0, 0, 0.05)' },
          sm: { value: { x: 0, y: 0, blur: 4, spread: 5, color: '#fff' } },
          md: { value: ['0 4px 6px -1px rgba(0, 0, 0, 0.1)', '0 2px 4px -1px rgba(0, 0, 0, 0.06)'] },
        },
      },
    })

    expect(dict.values).toMatchInlineSnapshot(`
      Map {
        "shadows.xs" => {
          "category": "shadows",
          "condition": "",
          "description": "",
          "key": "xs",
          "negative": false,
          "path": [
            "xs",
          ],
          "prop": "shadows.xs",
          "semantic": false,
          "value": "0 0 0 1px rgba(0, 0, 0, 0.05)",
          "var": "--shadows-xs",
          "varRef": "var(--shadows-xs)",
        },
        "shadows.sm" => {
          "category": "shadows",
          "condition": "",
          "description": "",
          "key": "sm",
          "negative": false,
          "path": [
            "sm",
          ],
          "prop": "shadows.sm",
          "semantic": false,
          "value": "0px 0px 4px 5px #fff",
          "var": "--shadows-sm",
          "varRef": "var(--shadows-sm)",
        },
        "shadows.md" => {
          "category": "shadows",
          "condition": "",
          "description": "",
          "key": "md",
          "negative": false,
          "path": [
            "md",
          ],
          "prop": "shadows.md",
          "semantic": false,
          "value": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          "var": "--shadows-md",
          "varRef": "var(--shadows-md)",
        },
      }
    `)

    expect(dict.flatValues).toMatchInlineSnapshot(`
      Map {
        "shadows" => {
          "md": "var(--shadows-md)",
          "sm": "var(--shadows-sm)",
          "xs": "var(--shadows-xs)",
        },
      }
    `)

    expect(dict.vars).toMatchInlineSnapshot(`
      Map {
        "--shadows-xs" => "0 0 0 1px rgba(0, 0, 0, 0.05)",
        "--shadows-sm" => "0px 0px 4px 5px #fff",
        "--shadows-md" => "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      }
    `)
  })

  test('shadows - with reference', () => {
    const dict = new TokenMap({
      tokens: {
        colors: { red: { 200: { value: '#fed7d7' } } },
        shadows: {
          sm: { value: { x: 0, y: 0, blur: 4, spread: 5, color: 'red.200' } },
        },
      },
    })

    expect(dict.values).toMatchInlineSnapshot(`
      Map {
        "colors.red.200" => {
          "category": "colors",
          "condition": "",
          "description": "",
          "key": "red.200",
          "negative": false,
          "path": [
            "red",
            "200",
          ],
          "prop": "colors.red.200",
          "semantic": false,
          "value": "#fed7d7",
          "var": "--colors-red-200",
          "varRef": "var(--colors-red-200)",
        },
        "shadows.sm" => {
          "category": "shadows",
          "condition": "",
          "description": "",
          "key": "sm",
          "negative": false,
          "path": [
            "sm",
          ],
          "prop": "shadows.sm",
          "semantic": false,
          "value": "0px 0px 4px 5px var(--colors-red-200)",
          "var": "--shadows-sm",
          "varRef": "var(--shadows-sm)",
        },
      }
    `)

    expect(dict.flatValues).toMatchInlineSnapshot(`
      Map {
        "colors" => {
          "red.200": "var(--colors-red-200)",
        },
        "shadows" => {
          "sm": "var(--shadows-sm)",
        },
      }
    `)

    expect(dict.vars).toMatchInlineSnapshot(`
      Map {
        "--colors-red-200" => "#fed7d7",
        "--shadows-sm" => "0px 0px 4px 5px var(--colors-red-200)",
      }
    `)
  })
})
