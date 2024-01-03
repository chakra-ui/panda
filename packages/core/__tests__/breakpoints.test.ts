import { fixturePreset } from '@pandacss/fixture'
import postcss from 'postcss'
import { describe, expect, test } from 'vitest'
import { Breakpoints } from '../src/breakpoints'

const breakpoints = fixturePreset.theme.breakpoints!
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
            "max": "47.9975em",
            "min": "40em",
            "name": "sm",
          },
        ],
        [
          "md",
          {
            "max": "63.9975em",
            "min": "48em",
            "name": "md",
          },
        ],
        [
          "lg",
          {
            "max": "79.9975em",
            "min": "64em",
            "name": "lg",
          },
        ],
        [
          "xl",
          {
            "max": "95.9975em",
            "min": "80em",
            "name": "xl",
          },
        ],
        [
          "2xl",
          {
            "max": undefined,
            "min": "96em",
            "name": "2xl",
          },
        ],
      ]
    `)

    expect(bp.values).toMatchInlineSnapshot(`
      {
        "2xl": {
          "max": undefined,
          "min": "96em",
          "name": "2xl",
        },
        "lg": {
          "max": "79.9975em",
          "min": "64em",
          "name": "lg",
        },
        "md": {
          "max": "63.9975em",
          "min": "48em",
          "name": "md",
        },
        "sm": {
          "max": "47.9975em",
          "min": "40em",
          "name": "sm",
        },
        "xl": {
          "max": "95.9975em",
          "min": "80em",
          "name": "xl",
        },
      }
    `)

    expect(bp.ranges).toMatchInlineSnapshot(`
      {
        "2xl": "screen and (min-width: 96em)",
        "2xlDown": "screen and (max-width: 95.9975em)",
        "2xlOnly": "screen and (min-width: 96em)",
        "lg": "screen and (min-width: 64em)",
        "lgDown": "screen and (max-width: 63.9975em)",
        "lgOnly": "screen and (min-width: 64em) and (max-width: 79.9975em)",
        "lgTo2xl": "screen and (min-width: 64em) and (max-width: 95.9975em)",
        "lgToXl": "screen and (min-width: 64em) and (max-width: 79.9975em)",
        "md": "screen and (min-width: 48em)",
        "mdDown": "screen and (max-width: 47.9975em)",
        "mdOnly": "screen and (min-width: 48em) and (max-width: 63.9975em)",
        "mdTo2xl": "screen and (min-width: 48em) and (max-width: 95.9975em)",
        "mdToLg": "screen and (min-width: 48em) and (max-width: 63.9975em)",
        "mdToXl": "screen and (min-width: 48em) and (max-width: 79.9975em)",
        "sm": "screen and (min-width: 40em)",
        "smDown": "screen and (max-width: 39.9975em)",
        "smOnly": "screen and (min-width: 40em) and (max-width: 47.9975em)",
        "smTo2xl": "screen and (min-width: 40em) and (max-width: 95.9975em)",
        "smToLg": "screen and (min-width: 40em) and (max-width: 63.9975em)",
        "smToMd": "screen and (min-width: 40em) and (max-width: 47.9975em)",
        "smToXl": "screen and (min-width: 40em) and (max-width: 79.9975em)",
        "xl": "screen and (min-width: 80em)",
        "xlDown": "screen and (max-width: 79.9975em)",
        "xlOnly": "screen and (min-width: 80em) and (max-width: 95.9975em)",
        "xlTo2xl": "screen and (min-width: 80em) and (max-width: 95.9975em)",
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
          @media screen and (min-width: 48em){
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
          @media screen and (max-width: 47.9975em){
              .foo{
                  color: red;
              }
          }
          "
    `)
  })
})
