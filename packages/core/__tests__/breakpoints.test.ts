import { breakpoints } from '@pandacss/fixture'
import postcss from 'postcss'
import { describe, expect, test } from 'vitest'
import { Breakpoints } from '../src/breakpoints'

describe('Breakpoints', () => {
  test('should resolve breakpoints', () => {
    const bp = new Breakpoints(breakpoints)
    expect(bp.sorted).toMatchInlineSnapshot(`
      [
        [
          "sm",
          {
            "max": "47.996875em",
            "min": "30em",
            "name": "sm",
          },
        ],
        [
          "md",
          {
            "max": "61.996875em",
            "min": "48em",
            "name": "md",
          },
        ],
        [
          "lg",
          {
            "max": "79.996875em",
            "min": "62em",
            "name": "lg",
          },
        ],
        [
          "xl",
          {
            "max": "95.996875em",
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
          "max": "79.996875em",
          "min": "62em",
          "name": "lg",
        },
        "md": {
          "max": "61.996875em",
          "min": "48em",
          "name": "md",
        },
        "sm": {
          "max": "47.996875em",
          "min": "30em",
          "name": "sm",
        },
        "xl": {
          "max": "95.996875em",
          "min": "80em",
          "name": "xl",
        },
      }
    `)

    expect(bp.ranges).toMatchInlineSnapshot(`
      {
        "2xl": "screen and (min-width: 96em)",
        "2xlOnly": "screen and (min-width: 96em)",
        "lg": "screen and (min-width: 62em)",
        "lgDown": "screen and (max-width: 79.996875em)",
        "lgOnly": "screen and (min-width: 62em) and (max-width: 79.996875em)",
        "lgTo2xl": "screen and (min-width: 62em)",
        "lgToXl": "screen and (min-width: 62em) and (max-width: 95.996875em)",
        "md": "screen and (min-width: 48em)",
        "mdDown": "screen and (max-width: 61.996875em)",
        "mdOnly": "screen and (min-width: 48em) and (max-width: 61.996875em)",
        "mdTo2xl": "screen and (min-width: 48em)",
        "mdToLg": "screen and (min-width: 48em) and (max-width: 79.996875em)",
        "mdToXl": "screen and (min-width: 48em) and (max-width: 95.996875em)",
        "sm": "screen and (min-width: 30em)",
        "smDown": "screen and (max-width: 47.996875em)",
        "smOnly": "screen and (min-width: 30em) and (max-width: 47.996875em)",
        "smTo2xl": "screen and (min-width: 30em)",
        "smToLg": "screen and (min-width: 30em) and (max-width: 79.996875em)",
        "smToMd": "screen and (min-width: 30em) and (max-width: 61.996875em)",
        "smToXl": "screen and (min-width: 30em) and (max-width: 95.996875em)",
        "xl": "screen and (min-width: 80em)",
        "xlDown": "screen and (max-width: 95.996875em)",
        "xlOnly": "screen and (min-width: 80em) and (max-width: 95.996875em)",
        "xlTo2xl": "screen and (min-width: 80em)",
      }
    `)
  })

  test('should expand screen', () => {
    const root = postcss.parse(`
    @breakpoint md{
        .foo{
            color: red;
        }
    }
    `)

    const bp = new Breakpoints(breakpoints)
    bp.expandScreenAtRule(root)

    expect(root.toString()).toMatchInlineSnapshot(`
      "
          @media screen and (min-width: 48em){
              .foo{
                  color: red;
              }
          }
          "
    `)
  })
})
