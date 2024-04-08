import { describe, expect, test } from 'vitest'
import { processRecipe } from './fixture'
import { createGeneratorContext } from '@pandacss/fixture'

describe('recipe ruleset', () => {
  test('should work with basic', () => {
    expect(processRecipe('textStyle', { size: 'h1' })).toMatchInlineSnapshot(`
      "@layer recipes {
        @layer _base {
          .textStyle > :not([hidden]) ~ :not([hidden]) {
            border-inline-start-width: 20px;
            border-inline-end-width: 0px;
      }

          .textStyle {
            font-family: var(--fonts-mono);
      }
      }

        .textStyle--size_h1 {
          font-size: 5rem;
          line-height: 1em;
          font-weight: 800;
      }
      }"
    `)

    expect(processRecipe('textStyle', {})).toMatchInlineSnapshot(`
      "@layer recipes {
        @layer _base {
          .textStyle > :not([hidden]) ~ :not([hidden]) {
            border-inline-start-width: 20px;
            border-inline-end-width: 0px;
      }

          .textStyle {
            font-family: var(--fonts-mono);
      }
          }
      }"
    `)

    expect(processRecipe('textStyle', { size: { base: 'h1', md: 'h2' } })).toMatchInlineSnapshot(`
      "@layer recipes {
        @layer _base {
          .textStyle > :not([hidden]) ~ :not([hidden]) {
            border-inline-start-width: 20px;
            border-inline-end-width: 0px;
      }

          .textStyle {
            font-family: var(--fonts-mono);
      }
      }

        .textStyle--size_h1 {
          font-size: 5rem;
          line-height: 1em;
          font-weight: 800;
      }

        @media screen and (min-width: 48rem) {
          .md\\:textStyle--size_h2 {
            letter-spacing: -0.03em;
            font-size: 3rem;
            line-height: 1.2em;
            font-weight: 700;
      }
      }
      }"
    `)
  })

  test('should work with complex selectors', () => {
    expect(processRecipe('tooltipStyle', {})).toMatchInlineSnapshot(`
      "@layer recipes {
        @layer _base {
          [data-theme=dark] .tooltipStyle[data-tooltip],.dark .tooltipStyle[data-tooltip],.tooltipStyle[data-tooltip].dark,.tooltipStyle[data-tooltip][data-theme=dark],[data-theme=dark] .tooltipStyle [data-tooltip],.dark .tooltipStyle [data-tooltip],.tooltipStyle [data-tooltip].dark,.tooltipStyle [data-tooltip][data-theme=dark] {
            color: red;
      }
          }
      }"
    `)
  })

  test('should process recipe with conditions', () => {
    expect(createGeneratorContext().recipes.details.find((r) => r.baseName === 'buttonStyle')).toMatchInlineSnapshot(`
      {
        "baseName": "buttonStyle",
        "config": {
          "base": {
            "&:is(:hover, [data-hover])": {
              "backgroundColor": "var(--colors-red-200)",
              "color": "var(--colors-white)",
              "fontSize": "var(--font-sizes-3xl)",
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
          "deprecated": false,
          "description": "",
          "jsx": [
            "ButtonStyle",
          ],
          "staticCss": [],
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
                "&:is(:hover, [data-hover])": {
                  "backgroundColor": "blue",
                  "color": "var(--colors-white)",
                },
                "&[data-disabled]": {
                  "backgroundColor": "var(--colors-transparent)",
                  "border": "1px solid gray",
                  "color": "gray",
                },
                "backgroundColor": "var(--colors-transparent)",
                "border": "1px solid blue",
                "color": "blue",
              },
              "solid": {
                "&:is(:hover, [data-hover])": {
                  "backgroundColor": "darkblue",
                },
                "&[data-disabled]": {
                  "backgroundColor": "gray",
                  "color": "var(--colors-black)",
                  "fontSize": "var(--font-sizes-2xl)",
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
            display: inline-flex;
            align-items: center;
            justify-content: center;
      }

          .buttonStyle:is(:hover, [data-hover]) {
            color: var(--colors-white);
            background-color: var(--colors-red-200);
            font-size: var(--font-sizes-3xl);
      }
      }

        .buttonStyle--size_md {
          height: 3rem;
          min-width: 3rem;
          padding: 0 0.75rem;
      }

        .buttonStyle--variant_solid {
          color: var(--colors-white);
          background-color: blue;
      }

        .buttonStyle--variant_solid[data-disabled] {
          color: var(--colors-black);
          background-color: gray;
          font-size: var(--font-sizes-2xl);
      }

        .buttonStyle--variant_solid:is(:hover, [data-hover]) {
          background-color: darkblue;
      }
      }"
    `)

    expect(processRecipe('buttonStyle', { variant: { base: 'solid', lg: 'outline' } })).toMatchInlineSnapshot(`
      "@layer recipes {
        @layer _base {
          .buttonStyle {
            display: inline-flex;
            align-items: center;
            justify-content: center;
      }

          .buttonStyle:is(:hover, [data-hover]) {
            color: var(--colors-white);
            background-color: var(--colors-red-200);
            font-size: var(--font-sizes-3xl);
      }
      }

        .buttonStyle--size_md {
          height: 3rem;
          min-width: 3rem;
          padding: 0 0.75rem;
      }

        .buttonStyle--variant_solid {
          color: var(--colors-white);
          background-color: blue;
      }

        .buttonStyle--variant_solid[data-disabled] {
          color: var(--colors-black);
          background-color: gray;
          font-size: var(--font-sizes-2xl);
      }

        .buttonStyle--variant_solid:is(:hover, [data-hover]) {
          background-color: darkblue;
      }

        @media screen and (min-width: 64rem) {
          .lg\\:buttonStyle--variant_outline {
            border: 1px solid blue;
            color: blue;
            background-color: var(--colors-transparent);
      }

          .lg\\:buttonStyle--variant_outline[data-disabled] {
            border: 1px solid gray;
            color: gray;
            background-color: var(--colors-transparent);
      }

          .lg\\:buttonStyle--variant_outline:is(:hover, [data-hover]) {
            color: var(--colors-white);
            background-color: blue;
      }
      }
      }"
    `)
  })
})
