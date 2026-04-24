import { describe, expect, test } from 'vitest'
import { createRuleProcessor, processRecipe } from './fixture'
import { createGeneratorContext } from '@pandacss/fixture'

describe('recipe ruleset', () => {
  test('should work with basic', () => {
    expect(processRecipe('textStyle', { size: 'h1' })).toMatchInlineSnapshot(`
      "@layer recipes {
        @layer _base {
          .textStyle {
            font-family: var(--fonts-mono);
      }

          .textStyle > :not([hidden]) ~ :not([hidden]) {
            border-inline-start-width: 20px;
            border-inline-end-width: 0px;
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
          .textStyle {
            font-family: var(--fonts-mono);
      }

          .textStyle > :not([hidden]) ~ :not([hidden]) {
            border-inline-start-width: 20px;
            border-inline-end-width: 0px;
      }
          }
      }"
    `)

    expect(processRecipe('textStyle', { size: { base: 'h1', md: 'h2' } })).toMatchInlineSnapshot(`
      "@layer recipes {
        @layer _base {
          .textStyle {
            font-family: var(--fonts-mono);
      }

          .textStyle > :not([hidden]) ~ :not([hidden]) {
            border-inline-start-width: 20px;
            border-inline-end-width: 0px;
      }
      }

        .textStyle--size_h1 {
          font-size: 5rem;
          line-height: 1em;
          font-weight: 800;
      }

        @media screen and (min-width: 48rem) {
          .md\\:textStyle--size_h2 {
            font-size: 3rem;
            line-height: 1.2em;
            font-weight: 700;
            letter-spacing: -0.03em;
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
        "className": "buttonStyle",
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
            background-color: var(--colors-red-200);
            font-size: var(--font-sizes-3xl);
            color: var(--colors-white);
      }
      }

        .buttonStyle--size_md {
          padding: 0 0.75rem;
          height: 3rem;
          min-width: 3rem;
      }

        .buttonStyle--variant_solid {
          background-color: blue;
          color: var(--colors-white);
      }

        .buttonStyle--variant_solid[data-disabled] {
          background-color: gray;
          color: var(--colors-black);
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
            background-color: var(--colors-red-200);
            font-size: var(--font-sizes-3xl);
            color: var(--colors-white);
      }
      }

        .buttonStyle--size_md {
          padding: 0 0.75rem;
          height: 3rem;
          min-width: 3rem;
      }

        .buttonStyle--variant_solid {
          background-color: blue;
          color: var(--colors-white);
      }

        .buttonStyle--variant_solid[data-disabled] {
          background-color: gray;
          color: var(--colors-black);
          font-size: var(--font-sizes-2xl);
      }

        .buttonStyle--variant_solid:is(:hover, [data-hover]) {
          background-color: darkblue;
      }

        @media screen and (min-width: 64rem) {
          .lg\\:buttonStyle--variant_outline {
            border: 1px solid blue;
            background-color: var(--colors-transparent);
            color: blue;
      }

          .lg\\:buttonStyle--variant_outline[data-disabled] {
            border: 1px solid gray;
            background-color: var(--colors-transparent);
            color: gray;
      }

          .lg\\:buttonStyle--variant_outline:is(:hover, [data-hover]) {
            background-color: blue;
            color: var(--colors-white);
      }
      }
      }"
    `)
  })

  test('should emit compound variants in the recipe layer', () => {
    expect(
      createRuleProcessor({
        theme: {
          extend: {
            recipes: {
              buttonCompoundStyle: {
                className: 'buttonCompoundStyle',
                variants: {
                  visual: {
                    outlined: {},
                  },
                  intent: {
                    secondary: {},
                  },
                },
                compoundVariants: [
                  {
                    visual: 'outlined',
                    intent: 'secondary',
                    css: {
                      _active: {
                        background: 'teal.50',
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      })
        .recipe('buttonCompoundStyle', { visual: 'outlined', intent: 'secondary' })
        ?.toCss(),
    ).toMatchInlineSnapshot(`
      "@layer recipes {
        .buttonCompoundStyle--compound_0:is(:active, [data-active]) {
          background: var(--colors-teal-50);
      }
      }"
    `)
  })

  test('should emit multiple matching compound variants in declaration order', () => {
    expect(
      createRuleProcessor({
        theme: {
          extend: {
            recipes: {
              multiCompound: {
                className: 'multiCompound',
                variants: {
                  visual: { outlined: {}, solid: {} },
                  intent: { primary: {}, secondary: {} },
                },
                compoundVariants: [
                  {
                    visual: 'outlined',
                    intent: 'primary',
                    css: { color: 'red.500' },
                  },
                  {
                    visual: 'outlined',
                    css: { borderWidth: '1px' },
                  },
                  {
                    intent: 'primary',
                    css: { fontWeight: 'bold' },
                  },
                ],
              },
            },
          },
        },
      })
        .recipe('multiCompound', { visual: 'outlined', intent: 'primary' })
        ?.toCss(),
    ).toMatchInlineSnapshot(`
      "@layer recipes {
        .multiCompound--compound_0 {
          color: var(--colors-red-500);
      }

        .multiCompound--compound_1 {
          border-width: 1px;
      }

        .multiCompound--compound_2 {
          font-weight: var(--font-weights-bold);
      }
      }"
    `)
  })

  test('should not emit non-matching compound variants', () => {
    expect(
      createRuleProcessor({
        theme: {
          extend: {
            recipes: {
              partialMatch: {
                className: 'partialMatch',
                variants: {
                  visual: { outlined: {}, solid: {} },
                  intent: { primary: {}, secondary: {} },
                },
                compoundVariants: [
                  {
                    visual: 'outlined',
                    intent: 'primary',
                    css: { color: 'red.500' },
                  },
                  {
                    visual: 'solid',
                    intent: 'secondary',
                    css: { color: 'blue.500' },
                  },
                ],
              },
            },
          },
        },
      })
        .recipe('partialMatch', { visual: 'outlined', intent: 'primary' })
        ?.toCss(),
    ).toMatchInlineSnapshot(`
      "@layer recipes {
        .partialMatch--compound_0 {
          color: var(--colors-red-500);
      }
      }"
    `)
  })

  test('should support array values in compound variants', () => {
    expect(
      createRuleProcessor({
        theme: {
          extend: {
            recipes: {
              arrayCompound: {
                className: 'arrayCompound',
                variants: {
                  visual: { outlined: {}, ghost: {}, solid: {} },
                  intent: { primary: {}, secondary: {} },
                },
                compoundVariants: [
                  {
                    visual: ['outlined', 'ghost'],
                    intent: 'primary',
                    css: { color: 'red.500' },
                  },
                ],
              },
            },
          },
        },
      })
        .recipe('arrayCompound', { visual: 'ghost', intent: 'primary' })
        ?.toCss(),
    ).toMatchInlineSnapshot(`
      "@layer recipes {
        .arrayCompound--compound_0 {
          color: var(--colors-red-500);
      }
      }"
    `)
  })

  test('should emit slot recipe compound variants in the recipe layer', () => {
    expect(
      createRuleProcessor({
        theme: {
          extend: {
            slotRecipes: {
              card: {
                className: 'card',
                slots: ['root', 'title'],
                variants: {
                  size: { sm: {}, lg: {} },
                  emphasis: { high: {}, low: {} },
                },
                compoundVariants: [
                  {
                    size: 'lg',
                    emphasis: 'high',
                    css: {
                      root: { padding: '4' },
                      title: { fontSize: '2xl' },
                    },
                  },
                ],
              },
            },
          },
        },
      })
        .recipe('card', { size: 'lg', emphasis: 'high' })
        ?.toCss(),
    ).toMatchInlineSnapshot(`
      "@layer recipes.slots {
        .card__root--compound_0 {
          padding: var(--spacing-4);
      }

        .card__title--compound_0 {
          font-size: var(--font-sizes-2xl);
      }
      }"
    `)
  })
})
