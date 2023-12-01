import { describe, expect, test } from 'vitest'
import { processRecipe } from './fixture'
import { fixtureDefaults } from '@pandacss/fixture'
import { Generator } from '../src'

describe('recipe ruleset', () => {
  test('should work with basic', () => {
    expect(processRecipe('textStyle', { size: 'h1' })).toMatchInlineSnapshot(`
      "@layer recipes {
        @layer _base {
          .textStyle {
            font-family: var(--fonts-mono);
          }

          .textStyle > :not([hidden]) ~ :not([hidden]) {
            border-inline-width: 20px 0;
          }
        }

        .textStyle--size_h1 {
          font-size: 5rem;
          font-weight: 800;
          line-height: 1em;
        }
      }
      "
    `)

    expect(processRecipe('textStyle', {})).toMatchInlineSnapshot(`
      "@layer recipes {
        @layer _base {
          .textStyle {
            font-family: var(--fonts-mono);
          }

          .textStyle > :not([hidden]) ~ :not([hidden]) {
            border-inline-width: 20px 0;
          }
        }
      }
      "
    `)

    expect(processRecipe('textStyle', { size: { base: 'h1', md: 'h2' } })).toMatchInlineSnapshot(`
      "@layer recipes {
        @layer _base {
          .textStyle {
            font-family: var(--fonts-mono);
          }

          .textStyle > :not([hidden]) ~ :not([hidden]) {
            border-inline-width: 20px 0;
          }
        }

        .textStyle--size_h1 {
          font-size: 5rem;
          font-weight: 800;
          line-height: 1em;
        }

        @media screen and (width >= 48em) {
          .md\\\\:textStyle--size_h2 {
            letter-spacing: -.03em;
            font-size: 3rem;
            font-weight: 700;
            line-height: 1.2em;
          }
        }
      }
      "
    `)
  })

  test('should work with complex selectors', () => {
    expect(processRecipe('tooltipStyle', {})).toMatchInlineSnapshot(`
      "@layer recipes {
        @layer _base {
          [data-theme=\\"dark\\"] .tooltipStyle[data-tooltip], .dark .tooltipStyle[data-tooltip], .tooltipStyle[data-tooltip].dark, .tooltipStyle[data-tooltip][data-theme=\\"dark\\"], [data-theme=\\"dark\\"] .tooltipStyle [data-tooltip], .dark .tooltipStyle [data-tooltip], .tooltipStyle [data-tooltip].dark, .tooltipStyle [data-tooltip][data-theme=\\"dark\\"] {
            color: red;
          }
        }
      }
      "
    `)
  })

  test('should process recipe with conditions', () => {
    expect(new Generator(fixtureDefaults).recipes.details.find((r) => r.baseName === 'buttonStyle'))
      .toMatchInlineSnapshot(`
        {
          "baseName": "buttonStyle",
          "config": {
            "base": {
              "&": {
                "&:is(:hover, [data-hover])": {
                  "backgroundColor": "var(--colors-red-200)",
                },
              },
              "alignItems": "center",
              "display": "inline-flex",
              "justifyContent": "center",
            },
            "className": "buttonStyle",
            "compoundVariants": [],
            "defaultVariants": {
              "size": "md",
              "variant": "solid",
            },
            "description": "",
            "jsx": [
              "ButtonStyle",
            ],
            "variants": {
              "size": {
                "md": {
                  "height": "3rem",
                  "minWidth": "3rem",
                  "padding": "0 0.75rem",
                },
                "sm": {
                  "height": "2.5rem",
                  "minWidth": "2.5rem",
                  "padding": "0 0.5rem",
                },
              },
              "variant": {
                "outline": {
                  "&": {
                    "&:is(:hover, [data-hover])": {
                      "backgroundColor": "blue",
                      "color": "var(--colors-white)",
                    },
                    "&[data-disabled]": {
                      "backgroundColor": "var(--colors-transparent)",
                      "border": "1px solid gray",
                      "color": "gray",
                    },
                  },
                  "backgroundColor": "var(--colors-transparent)",
                  "border": "1px solid blue",
                  "color": "blue",
                },
                "solid": {
                  "&": {
                    "&:is(:hover, [data-hover])": {
                      "backgroundColor": "darkblue",
                    },
                    "&[data-disabled]": {
                      "backgroundColor": "gray",
                      "color": "var(--colors-black)",
                    },
                  },
                  "backgroundColor": "blue",
                  "color": "var(--colors-white)",
                },
              },
            },
          },
          "dashName": "button-style",
          "jsx": [
            "ButtonStyle",
          ],
          "jsxName": "ButtonStyle",
          "match": /\\^ButtonStyle\\$/,
          "props": [
            "size",
            "variant",
          ],
          "splitProps": [Function],
          "type": "recipe",
          "upperName": "ButtonStyle",
          "variantKeyMap": {
            "size": [
              "sm",
              "md",
            ],
            "variant": [
              "solid",
              "outline",
            ],
          },
          "variantKeys": [
            "size",
            "variant",
          ],
        }
      `)

    expect(processRecipe('buttonStyle', { variant: 'solid' })).toMatchInlineSnapshot(`
      "@layer recipes {
        @layer _base {
          .buttonStyle {
            justify-content: center;
            align-items: center;
            display: inline-flex;
          }

          .buttonStyle:is(:hover, [data-hover]) {
            background-color: var(--colors-red-200);
          }
        }

        .buttonStyle--size_md {
          min-width: 3rem;
          height: 3rem;
          padding: 0 .75rem;
        }

        .buttonStyle--variant_solid {
          color: var(--colors-white);
          background-color: #00f;
        }

        .buttonStyle--variant_solid:is(:hover, [data-hover]) {
          background-color: #00008b;
        }

        .buttonStyle--variant_solid[data-disabled] {
          color: var(--colors-black);
          background-color: gray;
        }
      }
      "
    `)

    expect(processRecipe('buttonStyle', { variant: { base: 'solid', lg: 'outline' } })).toMatchInlineSnapshot(
      `
      "@layer recipes {
        @layer _base {
          .buttonStyle {
            justify-content: center;
            align-items: center;
            display: inline-flex;
          }

          .buttonStyle:is(:hover, [data-hover]) {
            background-color: var(--colors-red-200);
          }
        }

        .buttonStyle--size_md {
          min-width: 3rem;
          height: 3rem;
          padding: 0 .75rem;
        }

        .buttonStyle--variant_solid {
          color: var(--colors-white);
          background-color: #00f;
        }

        .buttonStyle--variant_solid:is(:hover, [data-hover]) {
          background-color: #00008b;
        }

        .buttonStyle--variant_solid[data-disabled] {
          color: var(--colors-black);
          background-color: gray;
        }

        @media screen and (width >= 64em) {
          .lg\\\\:buttonStyle--variant_outline {
            background-color: var(--colors-transparent);
            color: #00f;
            border: 1px solid #00f;
          }

          .lg\\\\:buttonStyle--variant_outline:is(:hover, [data-hover]) {
            color: var(--colors-white);
            background-color: #00f;
          }

          .lg\\\\:buttonStyle--variant_outline[data-disabled] {
            background-color: var(--colors-transparent);
            color: gray;
            border: 1px solid gray;
          }
        }
      }
      "
    `,
    )
  })
})
