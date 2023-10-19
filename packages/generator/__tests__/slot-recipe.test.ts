import { describe, expect, test } from 'vitest'
import { processRecipe } from './fixture'

describe('slot recipe ruleset', () => {
  test('should work', () => {
    expect(processRecipe('checkbox', { size: 'sm' })).toMatchInlineSnapshot(`
      "@layer recipes.slots {
        @layer _base {
          .checkbox__root {
            align-items: center;
            gap: var(--spacing-2);
            display: flex;
          }

          .checkbox__control {
            border-radius: var(--radii-sm);
            border-width: 1px;
          }

          .checkbox__label {
            margin-inline-start: var(--spacing-2);
          }
        }

        .checkbox__control--size_sm {
          font-size: 2rem;
          font-weight: var(--font-weights-bold);
          width: var(--sizes-8);
          height: var(--sizes-8);
        }

        .checkbox__label--size_sm {
          font-size: var(--font-sizes-sm);
        }
      }
      "
    `)
  })

  test('assigned recipe with default jsx from slots', () => {
    expect(processSlotRecipe('button', { size: 'sm' }).getRecipe('button')).toMatchInlineSnapshot(`
      {
        "baseName": "button",
        "config": {
          "base": {
            "container": {
              "fontFamily": "mono",
            },
            "icon": {
              "fontSize": "1.5rem",
            },
          },
          "className": "button",
          "slots": [
            "container",
            "icon",
          ],
          "variants": {
            "size": {
              "md": {
                "container": {
                  "fontSize": "3rem",
                  "lineHeight": "1.2em",
                },
              },
              "sm": {
                "container": {
                  "fontSize": "5rem",
                  "lineHeight": "1em",
                },
                "icon": {
                  "fontSize": "2rem",
                },
              },
            },
          },
        },
        "dashName": "button",
        "jsx": [
          "Button",
          "Button.Container",
          "Button.Icon",
        ],
        "jsxName": "Button",
        "match": /\\^Button\\$\\|\\^Button\\.Container\\$\\|\\^Button\\.Icon\\$/,
        "props": [
          "size",
        ],
        "splitProps": [Function],
        "type": "recipe",
        "upperName": "Button",
        "variantKeyMap": {
          "size": [
            "sm",
            "md",
          ],
        },
        "variantKeys": [
          "size",
        ],
      }
    `)
  })
})
