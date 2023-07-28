import { describe, expect, test } from 'vitest'
import { walkObject } from '@pandacss/shared'

const assign = (obj: Record<string, any>, path: string[], value: any) => {
  const last = path.pop()
  const target = path.reduce((acc, key) => {
    if (acc[key] == null) acc[key] = {}
    return acc[key]
  }, obj)
  if (last != null) target[last] = value
}

function sva(recipe: any) {
  const parts = recipe.slots
    .map((slot: string) => [
      slot,
      // setup base recipe
      {
        // create class-base on BEM
        className: [recipe.className ?? '', slot].join('__'),
        base: {},
        variants: {},
        defaultVariants: recipe.defaultVariants ?? {},
        compoundVariants: [],
      },
    ])
    .map(([slot, cva]: [string, any]) => {
      // assign base styles
      const base = recipe.base[slot]
      if (base) cva.base = base

      // assign variants
      walkObject(recipe.variants, (variant: any, path: string[]) => assign(cva, ['variants', ...path], variant[slot]), {
        stop: (_value, path) => path.includes(slot),
      })

      // assign compound variants
      recipe.compoundVariants.forEach((compoundVariant: any) => {
        const slotCss = compoundVariant.css[slot]
        if (!slotCss) return
        cva.compoundVariants.push({ ...compoundVariant, css: slotCss })
      })

      return [slot, cva]
    })

  return Object.fromEntries(parts)
}

describe('Slot recipes', () => {
  test('should work', () => {
    const result = sva({
      className: 'btn',
      slots: ['button', 'text'],
      base: {
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

    expect(result).toMatchInlineSnapshot(`
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
