import { describe, expect, test } from 'vitest'
import { getSlotRecipes } from '../src/slot'

describe('get-slot-recipes', () => {
  test('should work', () => {
    const slots = getSlotRecipes({
      className: 'btn',
      slots: ['root', 'button', 'text'],
      base: {
        root: {
          color: 'red',
        },
        button: {
          fontSize: '1rem',
        },
        text: {
          letterSpacing: '0.1em',
        },
      },
      variants: {
        variant: {
          size: {
            small: {
              button: {
                bg: 'red.200',
              },
              text: {
                color: 'pink',
              },
            },
          },
        },
      },
      defaultVariants: {
        size: 'small',
      },
      compoundVariants: [
        {
          variant: 'size',
          size: 'small',
          css: {
            button: {},
            text: {},
          },
        },
      ],
    })

    expect(slots).toMatchInlineSnapshot(`
      {
        "button": {
          "base": {
            "fontSize": "1rem",
          },
          "className": "btn__button",
          "compoundVariants": [
            {
              "css": {},
              "size": "small",
              "variant": "size",
            },
          ],
          "defaultVariants": {
            "size": "small",
          },
          "variants": {
            "variant": {
              "size": {
                "small": {
                  "bg": "red.200",
                },
              },
            },
          },
        },
        "root": {
          "base": {
            "color": "red",
          },
          "className": "btn__root",
          "compoundVariants": [],
          "defaultVariants": {
            "size": "small",
          },
          "variants": {},
        },
        "text": {
          "base": {
            "letterSpacing": "0.1em",
          },
          "className": "btn__text",
          "compoundVariants": [
            {
              "css": {},
              "size": "small",
              "variant": "size",
            },
          ],
          "defaultVariants": {
            "size": "small",
          },
          "variants": {
            "variant": {
              "size": {
                "small": {
                  "color": "pink",
                },
              },
            },
          },
        },
      }
    `)
  })
})
