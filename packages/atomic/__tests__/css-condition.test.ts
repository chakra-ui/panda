import { expect, test } from 'vitest'
import { conditions } from '@css-panda/fixture'
import { CSSCondition } from '../src/css-condition'

test.only('condition transformation', () => {
  const css = new CSSCondition({ conditions })
  expect(css.normalize('@media (min-width: 768px)')).toMatchInlineSnapshot(`
    {
      "name": "media",
      "raw": "@media (min-width: 768px)",
      "type": "at-rule",
      "value": "(min-width: 768px)",
    }
  `)

  expect(
    css.normalize({
      type: 'screen',
      value: 'sm',
      rawValue: '@media (min-width: 320px)',
    }),
  ).toMatchInlineSnapshot(`
    {
      "name": "screen",
      "raw": "sm",
      "rawValue": "@media (min-width: 320px)",
      "type": "at-rule",
      "value": "sm",
    }
  `)

  expect(css.normalize({ type: 'color-scheme', value: '[data-theme=dark] &', colorScheme: 'dark' }))
    .toMatchInlineSnapshot(`
      {
        "colorScheme": "dark",
        "raw": "[data-theme=dark] &",
        "type": "parent-nesting",
        "value": "[data-theme=dark] &",
      }
    `)

  expect(css.normalize('[dir=rtl] &')).toMatchInlineSnapshot(`
    {
      "raw": "[dir=rtl] &",
      "type": "parent-nesting",
      "value": "[dir=rtl] &",
    }
  `)

  expect(css.normalize('&::after')).toMatchInlineSnapshot(`
    {
      "raw": "&::after",
      "type": "self-nesting",
      "value": "&::after",
    }
  `)

  expect(css.resolve(['sm', 'hover'])).toMatchInlineSnapshot(`
    Set {
      {
        "raw": "&:hover",
        "type": "self-nesting",
        "value": "&:hover",
      },
      {
        "name": "screen",
        "raw": "sm",
        "rawValue": "@media screen and (min-width: 30em)",
        "type": "at-rule",
        "value": "sm",
      },
    }
  `)

  expect(css.resolve(['sm', 'hover'])).toMatchInlineSnapshot(`
    Set {
      {
        "raw": "&:hover",
        "type": "self-nesting",
        "value": "&:hover",
      },
      {
        "name": "screen",
        "raw": "sm",
        "rawValue": "@media screen and (min-width: 30em)",
        "type": "at-rule",
        "value": "sm",
      },
    }
  `)

  expect(css.resolve(['sm', 'rtl', 'hover'])).toMatchInlineSnapshot(`
    Set {
      {
        "raw": "&:hover",
        "type": "self-nesting",
        "value": "&:hover",
      },
      {
        "raw": "[dir=rtl] &",
        "type": "parent-nesting",
        "value": "[dir=rtl] &",
      },
      {
        "name": "screen",
        "raw": "sm",
        "rawValue": "@media screen and (min-width: 30em)",
        "type": "at-rule",
        "value": "sm",
      },
    }
  `)
})
