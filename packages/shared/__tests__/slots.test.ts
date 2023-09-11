import { describe, expect, test } from 'vitest'
import { getSlotRecipes } from '../src/slot'

describe('getSlotRecipes', () => {
  test('should split recipes into smaller cva(s)', () => {
    const slots = getSlotRecipes({
      className: 'btn',
      slots: ['root', 'button', 'text'],
      base: {
        root: { color: 'red' },
        button: { fontSize: '1rem' },
        text: { letterSpacing: '0.1em' },
      },
      variants: {
        size: {
          small: {
            button: { bg: 'red.200' },
            text: { color: 'pink' },
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
            "size": {
              "small": {
                "bg": "red.200",
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
          "variants": {
            "size": {
              "small": {},
            },
          },
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
            "size": {
              "small": {
                "color": "pink",
              },
            },
          },
        },
      }
    `)
  })

  test('should resolve recipes when slot and variant use the same key', () => {
    const slots = getSlotRecipes({
      slots: ['root', 'icon'],
      base: {
        root: { bg: 'green.600', p: '2em' },
        icon: { bg: 'neutral.100', p: '3', ml: '1em', borderRadius: '9999px' },
      },
      variants: {
        icon: {
          true: {
            root: { bg: 'blue.600' },
            icon: { bg: 'red.400' },
          },
        },
        size: {
          sm: {
            root: { bg: 'blue.600' },
            icon: { bg: 'red.400' },
          },
        },
      },
    })

    expect(slots).toMatchInlineSnapshot(`
      {
        "icon": {
          "base": {
            "bg": "neutral.100",
            "borderRadius": "9999px",
            "ml": "1em",
            "p": "3",
          },
          "className": "icon",
          "compoundVariants": [],
          "defaultVariants": {},
          "variants": {
            "icon": {
              "true": {
                "bg": "red.400",
              },
            },
            "size": {
              "sm": {
                "bg": "red.400",
              },
            },
          },
        },
        "root": {
          "base": {
            "bg": "green.600",
            "p": "2em",
          },
          "className": "root",
          "compoundVariants": [],
          "defaultVariants": {},
          "variants": {
            "icon": {
              "true": {
                "bg": "blue.600",
              },
            },
            "size": {
              "sm": {
                "bg": "blue.600",
              },
            },
          },
        },
      }
    `)
  })
})
