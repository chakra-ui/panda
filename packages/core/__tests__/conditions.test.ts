import { fixturePreset } from '@pandacss/fixture'
import { describe, expect, test } from 'vitest'
import { Conditions } from '../src/conditions'
import { compareAtRuleOrMixed as _compareAtRuleOrMixed } from '../src/sort-style-rules'

describe('Conditions', () => {
  test('condition transformation', () => {
    const css = new Conditions({ conditions: fixturePreset.conditions!, breakpoints: fixturePreset.theme.breakpoints })
    expect(css.normalize('@media (min-width: 768px)')).toMatchInlineSnapshot(`
      {
        "name": "media",
        "params": "(min-width: 768px)",
        "raw": "@media (min-width: 768px)",
        "type": "at-rule",
        "value": "(min-width: 768px)",
      }
    `)

    expect(css.getRaw('sm')).toMatchInlineSnapshot(`
      {
        "name": "breakpoint",
        "params": "screen and (min-width: 40rem)",
        "raw": "@media screen and (min-width: 40rem)",
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
    expect(css.normalize(['@media (hover: hover) and (pointer: fine)', '@supports (display: grid)', '&:hover']))
      .toMatchInlineSnapshot(`
        {
          "raw": [
            "@media (hover: hover) and (pointer: fine)",
            "@supports (display: grid)",
            "&:hover",
          ],
          "type": "mixed",
          "value": [
            {
              "name": "media",
              "params": "(hover: hover) and (pointer: fine)",
              "raw": "@media (hover: hover) and (pointer: fine)",
              "type": "at-rule",
              "value": "(hover: hover) and (pointer: fine)",
            },
            {
              "name": "supports",
              "params": "(display: grid)",
              "raw": "@supports (display: grid)",
              "type": "at-rule",
              "value": "(display: grid)",
            },
            {
              "raw": "&:hover",
              "type": "self-nesting",
              "value": "&:hover",
            },
          ],
        }
      `)
  })

  test('conditions sorting', () => {
    const css = new Conditions({ conditions: fixturePreset.conditions!, breakpoints: fixturePreset.theme.breakpoints })
    const conditions = ['sm', 'md', 'lg', '_hover', '_focus', '_focus-visible', '_focus-within', '_active']
    expect(css.sort(conditions).map((c) => c.raw)).toMatchInlineSnapshot(`
      [
        "@media screen and (min-width: 40rem)",
        "@media screen and (min-width: 48rem)",
        "@media screen and (min-width: 64rem)",
        "&:is(:hover, [data-hover])",
        "&:is(:focus, [data-focus])",
        "&:is(:active, [data-active])",
      ]
    `)
  })

  test('compare at-rule or mixed', () => {
    const compareAtRuleOrMixed = _compareAtRuleOrMixed as (a: any, b: any) => number
    const conds = new Conditions({})
    const a = {
      conditions: [
        conds.normalize('@media (hover: hover) and (pointer: fine)')!,
        conds.normalize('@supports (display: grid)')!,
        conds.normalize('&:hover')!,
      ],
    }
    const b = {
      conditions: [
        conds.normalize('@media (hover: hover) and (pointer: fine)')!,
        conds.normalize('@supports (display: grid)')!,
        conds.normalize('&:hover')!,
      ],
    }

    const b2 = {
      conditions: [
        conds.normalize(['@media (hover: hover) and (pointer: fine)', '@supports (display: grid)', '&:hover'])!,
      ],
    }

    expect(compareAtRuleOrMixed(a, b)).toBe(0)
    expect(compareAtRuleOrMixed(a, b2)).toBe(0)

    const c = {
      conditions: [
        conds.normalize('@media (hover: hover) and (pointer: fine)')!,
        conds.normalize('@supports (display: grid)')!,
        conds.normalize('&:hover')!,
      ],
    }

    const d = {
      conditions: [
        conds.normalize('@media (hover: hover) and (pointer: fine)')!,
        conds.normalize('@supports (display: grid)')!,
      ],
    }

    expect(compareAtRuleOrMixed(c, d)).toBe(1)

    const e = {
      conditions: [
        conds.normalize('@media (hover: hover) and (pointer: fine)')!,
        conds.normalize('@supports (display: grid)')!,
      ],
    }

    const f = {
      conditions: [
        conds.normalize('@media (hover: hover) and (pointer: fine)')!,
        conds.normalize('@supports (display: grid)')!,
        conds.normalize('&:hover')!,
      ],
    }

    expect(compareAtRuleOrMixed(e, f)).toBe(-1)

    const g = {
      conditions: [
        conds.normalize('@media (hover: hover) and (pointer: fine)')!,
        conds.normalize('@supports (display: grid)')!,
      ],
    }

    const h = {
      conditions: [conds.normalize('@media (hover: hover) and (pointer: fine)')!],
    }

    expect(compareAtRuleOrMixed(g, h)).toBe(1)

    const i = {
      conditions: [conds.normalize('@media (hover: hover) and (pointer: fine)')!],
    }

    const j = {
      conditions: [conds.normalize('@media (hover: hover) and (pointer: fine)')!],
    }

    expect(compareAtRuleOrMixed(i, j)).toBe(0)

    const k = {
      conditions: [conds.normalize('@media (hover: hover) and (pointer: fine)')!],
    }

    const l = {
      conditions: [
        conds.normalize('@media (hover: hover) and (pointer: fine)')!,
        conds.normalize('@supports (display: grid)')!,
      ],
    }

    expect(compareAtRuleOrMixed(k, l)).toBe(-1)

    const m = {
      conditions: [
        conds.normalize('@media (hover: hover) and (pointer: fine)')!,
        conds.normalize('@supports (display: grid)')!,
      ],
    }

    const n = {
      conditions: [
        conds.normalize('@media (hover: hover) and (pointer: fine)')!,
        conds.normalize('@supports (display: grid)')!,
      ],
    }

    expect(compareAtRuleOrMixed(m, n)).toBe(0)
  })

  test('pseudo-elements sort after pseudo-classes and mixed conditions', () => {
    // Simulates a real-world case: _before condition combined with a mixed hover condition
    // (e.g. hover: ['@media (hover: hover)', '&:is(:hover, [data-hover]):not(:active, :disabled)'])
    // The pseudo-element (::before) must come LAST in the selector chain per CSS spec.
    const css = new Conditions({
      conditions: {
        hover: ['@media (hover: hover) and (pointer: fine)', '&:is(:hover, [data-hover]):not(:active, :disabled)'],
        before: '&::before',
        after: '&::after',
        active: ['&:is(:active, [data-active]):not(:disabled)'],
        focus: '&:is(:focus, [data-focus])',
      },
    })

    // When _before appears first in the conditions array (as it does when nested inside _before in style objects),
    // it should still be sorted to appear AFTER the hover selector parts.
    // Without this fix, ::before would appear before :hover in the CSS selector, producing invalid CSS.
    const sorted = css.sort(['_before', '_hover'])
    expect(sorted.map((c) => c.raw)).toMatchInlineSnapshot(`
      [
        "@media (hover: hover) and (pointer: fine)",
        "&:is(:hover, [data-hover]):not(:active, :disabled)",
        "&::before",
      ]
    `)

    // Same test with ::after
    const sortedAfter = css.sort(['_after', '_hover'])
    expect(sortedAfter.map((c) => c.raw)).toMatchInlineSnapshot(`
      [
        "@media (hover: hover) and (pointer: fine)",
        "&:is(:hover, [data-hover]):not(:active, :disabled)",
        "&::after",
      ]
    `)

    // Pseudo-element with a non-mixed self-nesting condition
    const sortedFocus = css.sort(['_before', '_focus'])
    expect(sortedFocus.map((c) => c.raw)).toMatchInlineSnapshot(`
      [
        "&:is(:focus, [data-focus])",
        "&::before",
      ]
    `)

    // Pseudo-element with an array-wrapped self-nesting condition (active is ['&:is(...)'])
    const sortedActive = css.sort(['_before', '_active'])
    expect(sortedActive.map((c) => c.raw)).toMatchInlineSnapshot(`
      [
        "&:is(:active, [data-active]):not(:disabled)",
        "&::before",
      ]
    `)

    // When pseudo-element appears last naturally, order is preserved
    const sortedNatural = css.sort(['_hover', '_before'])
    expect(sortedNatural.map((c) => c.raw)).toMatchInlineSnapshot(`
      [
        "@media (hover: hover) and (pointer: fine)",
        "&:is(:hover, [data-hover]):not(:active, :disabled)",
        "&::before",
      ]
    `)
  })

  test('theme conditions', () => {
    const css = new Conditions({
      themes: {
        primary: { tokens: { colors: { brand: { value: 'blue' } } } },
        secondary: { tokens: { colors: { brand: { value: 'red' } } } },
      },
    })

    expect(css.values).toMatchInlineSnapshot(`
      {
        "_themePrimary": {
          "raw": "[data-panda-theme=primary] &",
          "type": "parent-nesting",
          "value": "[data-panda-theme=primary] &",
        },
        "_themeSecondary": {
          "raw": "[data-panda-theme=secondary] &",
          "type": "parent-nesting",
          "value": "[data-panda-theme=secondary] &",
        },
      }
    `)
  })
})
