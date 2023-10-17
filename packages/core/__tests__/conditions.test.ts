import { fixturePreset } from '@pandacss/fixture'
import { describe, expect, test } from 'vitest'
import { Conditions } from '../src/conditions'

describe('Conditions', () => {
  test('condition transformation', () => {
    const css = new Conditions({ conditions: fixturePreset.conditions!, breakpoints: fixturePreset.theme.breakpoints })
    expect(css.normalize('@media (min-width: 768px)')).toMatchInlineSnapshot(`
      {
        "name": "media",
        "raw": "@media (min-width: 768px)",
        "rawValue": "@media (min-width: 768px)",
        "type": "at-rule",
        "value": "(min-width: 768px)",
      }
    `)

    expect(css.getRaw('sm')).toMatchInlineSnapshot(`
      {
        "name": "breakpoint",
        "params": "screen and (min-width: 40em)",
        "raw": "sm",
        "rawValue": "@media screen and (min-width: 40em)",
        "type": "at-rule",
        "value": "sm",
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
  })
})
