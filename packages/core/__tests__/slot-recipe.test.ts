import { describe, expect, test } from 'vitest'
import { processRecipe } from './fixture'
import { createGeneratorContext } from '@pandacss/fixture'

describe('slot recipe ruleset', () => {
  test('should work', () => {
    expect(processRecipe('checkbox', { size: 'sm' })).toMatchInlineSnapshot(`
      "@layer recipes.slots {

        .checkbox__control--size_sm {
          font-size: 2rem;
          font-weight: var(--font-weights-bold);
          width: var(--sizes-8);
          height: var(--sizes-8)
      }

        .checkbox__label--size_sm {
          font-size: var(--font-sizes-sm)
      }

        @layer _base {
          .checkbox__root {
            display: flex;
            align-items: center;
            gap: var(--spacing-2)
      }

          .checkbox__control {
            border-width: 1px;
            border-radius: var(--radii-sm)
      }

          .checkbox__label {
            margin-inline-start: var(--spacing-2)
      }
      }
      }"
    `)
  })

  test('assigned recipe with default jsx from slots', () => {
    expect(createGeneratorContext().recipes.details.find((r) => r.baseName === 'checkbox')).toMatchInlineSnapshot(`
      {
        "baseName": "checkbox",
        "config": {
          "base": {
            "control": {
              "borderRadius": "sm",
              "borderWidth": "1px",
            },
            "label": {
              "marginStart": "2",
            },
            "root": {
              "alignItems": "center",
              "display": "flex",
              "gap": "2",
            },
          },
          "className": "checkbox",
          "defaultVariants": {
            "size": "sm",
          },
          "slots": [
            "root",
            "control",
            "label",
          ],
          "variants": {
            "size": {
              "lg": {
                "control": {
                  "height": "12",
                  "width": "12",
                },
                "label": {
                  "fontSize": "lg",
                },
              },
              "md": {
                "control": {
                  "height": "10",
                  "width": "10",
                },
                "label": {
                  "fontSize": "md",
                },
              },
              "sm": {
                "control": {
                  "height": "8",
                  "textStyle": "headline.h1",
                  "width": "8",
                },
                "label": {
                  "fontSize": "sm",
                },
              },
            },
          },
        },
        "dashName": "checkbox",
        "jsx": [
          "Checkbox",
          "Checkbox.Root",
          "Checkbox.Control",
          "Checkbox.Label",
        ],
        "jsxName": "Checkbox",
        "match": /\\^Checkbox\\$\\|\\^Checkbox\\.Root\\$\\|\\^Checkbox\\.Control\\$\\|\\^Checkbox\\.Label\\$/,
        "props": [
          "size",
        ],
        "splitProps": [Function],
        "type": "recipe",
        "upperName": "Checkbox",
        "variantKeyMap": {
          "size": [
            "sm",
            "md",
            "lg",
          ],
        },
        "variantKeys": [
          "size",
        ],
      }
    `)
  })
})
