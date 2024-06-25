import { builtInPresets } from '@pandacss/fixture'
import postcss from 'postcss'
import { describe, expect, test } from 'vitest'
import { Breakpoints } from '../src/breakpoints'

const breakpoints = builtInPresets.panda.theme.breakpoints!
const parse = (value: string) => {
  const root = postcss.parse(value)
  const bp = new Breakpoints(breakpoints)
  bp.expandScreenAtRule(root)
  return root.toString()
}

describe('Breakpoints', () => {
  test('should resolve breakpoints', () => {
    const bp = new Breakpoints(breakpoints)
    expect(bp.sorted).toMatchInlineSnapshot(`
      [
        [
          "sm",
          {
            "max": "47.9975rem",
            "min": "40rem",
            "name": "sm",
          },
        ],
        [
          "md",
          {
            "max": "63.9975rem",
            "min": "48rem",
            "name": "md",
          },
        ],
        [
          "lg",
          {
            "max": "79.9975rem",
            "min": "64rem",
            "name": "lg",
          },
        ],
        [
          "xl",
          {
            "max": "95.9975rem",
            "min": "80rem",
            "name": "xl",
          },
        ],
        [
          "2xl",
          {
            "max": undefined,
            "min": "96rem",
            "name": "2xl",
          },
        ],
      ]
    `)

    expect(bp.values).toMatchInlineSnapshot(`
      {
        "2xl": {
          "max": undefined,
          "min": "96rem",
          "name": "2xl",
        },
        "lg": {
          "max": "79.9975rem",
          "min": "64rem",
          "name": "lg",
        },
        "md": {
          "max": "63.9975rem",
          "min": "48rem",
          "name": "md",
        },
        "sm": {
          "max": "47.9975rem",
          "min": "40rem",
          "name": "sm",
        },
        "xl": {
          "max": "95.9975rem",
          "min": "80rem",
          "name": "xl",
        },
      }
    `)

    expect(bp.ranges).toMatchInlineSnapshot(`
      {
        "2xl": "screen and (min-width: 96rem)",
        "2xlDown": "screen and (max-width: 95.9975rem)",
        "2xlOnly": "screen and (min-width: 96rem)",
        "lg": "screen and (min-width: 64rem)",
        "lgDown": "screen and (max-width: 63.9975rem)",
        "lgOnly": "screen and (min-width: 64rem) and (max-width: 79.9975rem)",
        "lgTo2xl": "screen and (min-width: 64rem) and (max-width: 95.9975rem)",
        "lgToXl": "screen and (min-width: 64rem) and (max-width: 79.9975rem)",
        "md": "screen and (min-width: 48rem)",
        "mdDown": "screen and (max-width: 47.9975rem)",
        "mdOnly": "screen and (min-width: 48rem) and (max-width: 63.9975rem)",
        "mdTo2xl": "screen and (min-width: 48rem) and (max-width: 95.9975rem)",
        "mdToLg": "screen and (min-width: 48rem) and (max-width: 63.9975rem)",
        "mdToXl": "screen and (min-width: 48rem) and (max-width: 79.9975rem)",
        "sm": "screen and (min-width: 40rem)",
        "smDown": "screen and (max-width: 39.9975rem)",
        "smOnly": "screen and (min-width: 40rem) and (max-width: 47.9975rem)",
        "smTo2xl": "screen and (min-width: 40rem) and (max-width: 95.9975rem)",
        "smToLg": "screen and (min-width: 40rem) and (max-width: 63.9975rem)",
        "smToMd": "screen and (min-width: 40rem) and (max-width: 47.9975rem)",
        "smToXl": "screen and (min-width: 40rem) and (max-width: 79.9975rem)",
        "xl": "screen and (min-width: 80rem)",
        "xlDown": "screen and (max-width: 79.9975rem)",
        "xlOnly": "screen and (min-width: 80rem) and (max-width: 95.9975rem)",
        "xlTo2xl": "screen and (min-width: 80rem) and (max-width: 95.9975rem)",
      }
    `)
  })

  test('should expand screen', () => {
    const css = parse(`
    @breakpoint md{
        .foo{
            color: red;
        }
    }
    `)

    expect(css).toMatchInlineSnapshot(`
      "
          @media screen and (min-width: 48rem){
              .foo{
                  color: red;
              }
          }
          "
    `)
  })

  test('breakpoint down', () => {
    const css = parse(`
    @breakpoint mdDown{
        .foo{
            color: red;
        }
    }
    `)

    expect(css).toMatchInlineSnapshot(`
      "
          @media screen and (max-width: 47.9975rem){
              .foo{
                  color: red;
              }
          }
          "
    `)
  })
})
