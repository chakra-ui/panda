import { expect, test } from 'vitest'
import { markImportant } from '../src'

test('mark-important', () => {
  const obj = {
    base: 1,
    sm: { _hover: 2, truncate: true },
    _dark: {
      _disabled: { _open: { base: 11, xl: { _loading: 13, base: 12 } }, base: 10 },
      base: 3,
      md: 4,
      lg: { base: 5, _hover: 6 },
    },
  }
  expect(markImportant(obj)).toMatchInlineSnapshot(`
    {
      "_dark": {
        "_disabled": {
          "_open": {
            "base": "11 !important",
            "xl": {
              "_loading": "13 !important",
              "base": "12 !important",
            },
          },
          "base": "10 !important",
        },
        "base": "3 !important",
        "lg": {
          "_hover": "6 !important",
          "base": "5 !important",
        },
        "md": "4 !important",
      },
      "base": "1 !important",
      "sm": {
        "_hover": "2 !important",
        "truncate": true,
      },
    }
  `)
  expect(obj).toMatchInlineSnapshot(`
    {
      "_dark": {
        "_disabled": {
          "_open": {
            "base": 11,
            "xl": {
              "_loading": 13,
              "base": 12,
            },
          },
          "base": 10,
        },
        "base": 3,
        "lg": {
          "_hover": 6,
          "base": 5,
        },
        "md": 4,
      },
      "base": 1,
      "sm": {
        "_hover": 2,
        "truncate": true,
      },
    }
  `)
})
