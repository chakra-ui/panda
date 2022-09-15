import { breakpoints } from '@css-panda/fixture'
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
        "2xl_only": "screen and (min-width: 96em)",
        "lg": "screen and (min-width: 62em)",
        "lg_only": "screen and (min-width: 62em) and (max-width: 79.996875em)",
        "lg_to_2xl": "screen and (min-width: 62em)",
        "lg_to_xl": "screen and (min-width: 62em) and (max-width: 95.996875em)",
        "md": "screen and (min-width: 48em)",
        "md_only": "screen and (min-width: 48em) and (max-width: 61.996875em)",
        "md_to_2xl": "screen and (min-width: 48em)",
        "md_to_lg": "screen and (min-width: 48em) and (max-width: 79.996875em)",
        "md_to_xl": "screen and (min-width: 48em) and (max-width: 95.996875em)",
        "sm": "screen and (min-width: 30em)",
        "sm_only": "screen and (min-width: 30em) and (max-width: 47.996875em)",
        "sm_to_2xl": "screen and (min-width: 30em)",
        "sm_to_lg": "screen and (min-width: 30em) and (max-width: 79.996875em)",
        "sm_to_md": "screen and (min-width: 30em) and (max-width: 61.996875em)",
        "sm_to_xl": "screen and (min-width: 30em) and (max-width: 95.996875em)",
        "xl": "screen and (min-width: 80em)",
        "xl_only": "screen and (min-width: 80em) and (max-width: 95.996875em)",
        "xl_to_2xl": "screen and (min-width: 80em)",
      }
    `)
  })

  test('should expand screen', () => {
    const root = postcss.parse(`
    @screen md{
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
