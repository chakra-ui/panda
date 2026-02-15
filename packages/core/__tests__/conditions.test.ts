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

  describe('dynamic conditions', () => {
    test('has() and getRaw() for dynamic condition with and without modifier', () => {
      const conditions = new Conditions({
        conditions: {
          groupHover: (name?: string) =>
            name ? `.group\\/${name}:is(:hover, [data-hover]) &` : '.group:is(:hover, [data-hover]) &',
          nth: (value?: string) => `&:nth-child(${value ?? 'n'})`,
        },
      })

      expect(conditions.has('_groupHover')).toBe(true)
      expect(conditions.has('_groupHover/item')).toBe(true)
      expect(conditions.has('_nth')).toBe(true)
      expect(conditions.has('_nth/3')).toBe(true)
      expect(conditions.has('_unknown')).toBe(false)

      const groupHoverRaw = conditions.getRaw('_groupHover')
      expect(groupHoverRaw?.raw).toBe('.group:is(:hover, [data-hover]) &')

      const groupHoverItemRaw = conditions.getRaw('_groupHover/item')
      expect(groupHoverItemRaw?.raw).toBe('.group\\/item:is(:hover, [data-hover]) &')

      const nth3Raw = conditions.getRaw('_nth/3')
      expect(nth3Raw?.raw).toBe('&:nth-child(3)')
    })

    test('getDynamicConditionNames() returns dynamic condition base names', () => {
      const conditions = new Conditions({
        conditions: {
          groupHover: (name?: string) => (name ? `.group\\/${name}:hover &` : '.group:hover &'),
          nth: (value?: string) => `&:nth-child(${value ?? 'n'})`,
        },
      })
      expect(conditions.getDynamicConditionNames()).toEqual(['groupHover', 'nth'])
    })

    test('finalize and sort with dynamic keys', () => {
      const conditions = new Conditions({
        conditions: {
          groupHover: (name?: string) =>
            name ? `.group\\/${name}:is(:hover, [data-hover]) &` : '.group:is(:hover, [data-hover]) &',
        },
      })
      expect(conditions.finalize(['_groupHover/item'])).toEqual(['groupHover/item'])
      const sorted = conditions.sort(['_groupHover/item', '_groupHover'])
      expect(sorted.map((c) => c.raw)).toContain('.group\\/item:is(:hover, [data-hover]) &')
      expect(sorted.map((c) => c.raw)).toContain('.group:is(:hover, [data-hover]) &')
    })

    test('get() returns selector for dynamic condition', () => {
      const conditions = new Conditions({
        conditions: {
          groupHover: (name?: string) => (name ? `.group\\/${name}:hover &` : '.group:hover &'),
        },
      })
      expect(conditions.get('_groupHover')).toBe('.group:hover &')
      expect(conditions.get('_groupHover/card')).toBe('.group\\/card:hover &')
    })
  })
})
