import { expect, test } from 'vitest'
import { matchCondition } from '../src/condition'

test('condition transformation', () => {
  expect(matchCondition('@media (min-width: 768px)')).toMatchInlineSnapshot(`
    {
      "name": "media",
      "raw": "@media (min-width: 768px)",
      "type": "at-rule",
      "value": "(min-width: 768px)",
    }
  `)

  expect(matchCondition({ type: 'screen', value: 'sm' })).toMatchInlineSnapshot(`
    {
      "name": "screen",
      "raw": "sm",
      "type": "at-rule",
      "value": "sm",
    }
  `)

  expect(matchCondition({ type: 'color-scheme', value: '[data-theme=dark] &', colorScheme: 'dark' }))
    .toMatchInlineSnapshot(`
      {
        "colorScheme": "dark",
        "raw": "[data-theme=dark] &",
        "type": "parent-selector",
        "value": "[data-theme=dark] &",
      }
    `)

  expect(matchCondition('[dir=rtl] this')).toMatchInlineSnapshot(`
    {
      "raw": "[dir=rtl] this",
      "type": "pseudo-selector",
      "value": "[dir=rtl] this",
    }
  `)

  expect(matchCondition('this::after')).toMatchInlineSnapshot(`
    {
      "raw": "this::after",
      "type": "parent-selector",
      "value": "this::after",
    }
  `)
})
