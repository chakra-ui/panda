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
            "min": "640px",
            "name": "sm",
          },
        ],
        [
          "md",
          {
            "max": "63.996875em",
            "min": "768px",
            "name": "md",
          },
        ],
        [
          "lg",
          {
            "max": "79.996875em",
            "min": "1024px",
            "name": "lg",
          },
        ],
        [
          "xl",
          {
            "max": "95.996875em",
            "min": "1280px",
            "name": "xl",
          },
        ],
        [
          "2xl",
          {
            "max": undefined,
            "min": "1536px",
            "name": "2xl",
          },
        ],
      ]
    `)

    expect(bp.values).toMatchInlineSnapshot(`
      {
        "2xl": {
          "max": undefined,
          "min": "1536px",
          "name": "2xl",
        },
        "lg": {
          "max": "79.996875em",
          "min": "1024px",
          "name": "lg",
        },
        "md": {
          "max": "63.996875em",
          "min": "768px",
          "name": "md",
        },
        "sm": {
          "max": "47.996875em",
          "min": "640px",
          "name": "sm",
        },
        "xl": {
          "max": "95.996875em",
          "min": "1280px",
          "name": "xl",
        },
      }
    `)

    expect(bp.ranges).toMatchInlineSnapshot(`
      {
        "2xl": "screen and (min-width: 1536px)",
        "2xlOnly": "screen and (min-width: 1536px)",
        "lg": "screen and (min-width: 1024px)",
        "lgDown": "screen and (max-width: 79.996875em)",
        "lgOnly": "screen and (min-width: 1024px) and (max-width: 79.996875em)",
        "lgTo2xl": "screen and (min-width: 1024px)",
        "lgToXl": "screen and (min-width: 1024px) and (max-width: 95.996875em)",
        "md": "screen and (min-width: 768px)",
        "mdDown": "screen and (max-width: 63.996875em)",
        "mdOnly": "screen and (min-width: 768px) and (max-width: 63.996875em)",
        "mdTo2xl": "screen and (min-width: 768px)",
        "mdToLg": "screen and (min-width: 768px) and (max-width: 79.996875em)",
        "mdToXl": "screen and (min-width: 768px) and (max-width: 95.996875em)",
        "sm": "screen and (min-width: 640px)",
        "smDown": "screen and (max-width: 47.996875em)",
        "smOnly": "screen and (min-width: 640px) and (max-width: 47.996875em)",
        "smTo2xl": "screen and (min-width: 640px)",
        "smToLg": "screen and (min-width: 640px) and (max-width: 79.996875em)",
        "smToMd": "screen and (min-width: 640px) and (max-width: 63.996875em)",
        "smToXl": "screen and (min-width: 640px) and (max-width: 95.996875em)",
        "xl": "screen and (min-width: 1280px)",
        "xlDown": "screen and (max-width: 95.996875em)",
        "xlOnly": "screen and (min-width: 1280px) and (max-width: 95.996875em)",
        "xlTo2xl": "screen and (min-width: 1280px)",
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
          @media screen and (min-width: 768px){
              .foo{
                  color: red;
              }
          }
          "
    `)
  })
})
