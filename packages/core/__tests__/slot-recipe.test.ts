import { describe, expect, test } from 'vitest'
import { getSlotRecipe, processSlotRecipe } from './fixture'

describe('slot recipe ruleset', () => {
  test('should work', () => {
    expect(processSlotRecipe('button', { size: 'sm' })).toMatchInlineSnapshot(`
      "@layer recipes.slots {
          @layer _base {
              .button__container {
                  font-family: var(--fonts-mono)
              }
              .button__icon {
                  font-size: 1.5rem
              }
          }
          .button__container--size_sm {
              font-size: 5rem;
              line-height: 1em
          }
          .button__icon--size_sm {
              font-size: 2rem
          }
      }"
    `)
  })

  test('assigned recipe with default jsx from slots', () => {
    expect(getSlotRecipe('button')).toMatchInlineSnapshot(`
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
