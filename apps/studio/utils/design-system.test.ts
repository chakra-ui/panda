import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  aliasOf,
  orderCategories,
  remToPx,
  groupColors,
  index,
  isSemantic,
  parseSpec,
  sortTypeTokens,
  toPixels,
  type TokenView,
} from './design-system'

const raw = readFileSync(new URL('../public/sample-design-system.json', import.meta.url), 'utf8')
const parsed = parseSpec(raw)
if (!parsed.ok) throw new Error(parsed.error)
const ds = index(parsed.spec)
const colors = ds.view('colors')

const summarize = (semantic: boolean) =>
  groupColors(colors.filter((t) => isSemantic(ds, t) === semantic)).map(
    (g) => `${g.name}: ${g.tokens.map((t) => t.label).join(' ')}`,
  )

describe('groupColors', () => {
  it('groups semantic colors by their role prefix', () => {
    expect(summarize(true)).toMatchInlineSnapshot(`
      [
        "bg: canvas surface subtle muted emphasized inverted overlay",
        "fg: DEFAULT muted subtle disabled inverted",
        "border: DEFAULT muted emphasized",
        "accent: solid emphasized contrast fg muted subtle focusRing",
        "info: solid fg muted subtle",
        "success: solid fg muted subtle",
        "warning: solid fg muted subtle",
        "danger: solid fg muted subtle",
      ]
    `)
  })

  it('puts core colors without a palette into a base row ahead of the palettes', () => {
    expect(summarize(false).slice(0, 3)).toMatchInlineSnapshot(`
      [
        "base: current transparent black white",
        "slate: 50 100 200 300 400 500 600 700 800 900 950",
        "gray: 50 100 200 300 400 500 600 700 800 900 950",
      ]
    `)
  })
})

describe('isSemantic', () => {
  it('counts a raw-valued token with a dark value as semantic', () => {
    const overlay = colors.find((t) => t.path === 'colors.bg.overlay')!
    expect(overlay.semantic).toBeUndefined()
    expect(isSemantic(ds, overlay)).toBe(true)
  })

  it('leaves a palette shade as core', () => {
    expect(isSemantic(ds, colors.find((t) => t.path === 'colors.brand.500')!)).toBe(false)
  })
})

const token = (name: string, value: string) => ({ name, value, path: `x.${name}`, category: 'x' }) as TokenView

describe('sortTypeTokens', () => {
  it('orders font sizes in mixed units from small to large', () => {
    const sorted = sortTypeTokens('fontSizes', [token('lg', '1.25rem'), token('xs', '12px'), token('md', '1rem')])
    expect(sorted.map((t) => t.name)).toEqual(['xs', 'md', 'lg'])
  })

  it('orders named font weights by their numeric weight', () => {
    const sorted = sortTypeTokens('fontWeights', [token('heavy', 'bold'), token('base', 'normal'), token('mid', '500')])
    expect(sorted.map((t) => t.name)).toEqual(['base', 'mid', 'heavy'])
  })

  it('keeps fluid and variable values in their original order at the end', () => {
    const sorted = sortTypeTokens('fontSizes', [
      token('fluid', 'clamp(1rem, 2vw, 2rem)'),
      token('sm', '0.875rem'),
      token('themed', 'var(--size)'),
    ])
    expect(sorted.map((t) => t.name)).toEqual(['sm', 'fluid', 'themed'])
  })
})

describe('toPixels', () => {
  it('converts rem and passes px through', () => {
    expect(toPixels('1.125rem')).toBe(18)
    expect(toPixels('14px')).toBe(14)
  })

  it('returns nothing for values without a fixed pixel size', () => {
    expect(toPixels('1.5em')).toBeUndefined()
    expect(toPixels('clamp(1rem, 2vw, 2rem)')).toBeUndefined()
  })
})

describe('orderCategories', () => {
  const order = (types: string[]) => orderCategories(types.map((type) => ({ type }))).map((item) => item.type)

  it('orders the sample categories by purpose instead of A–Z', () => {
    expect(order(ds.categories())).toMatchInlineSnapshot(`
      [
        "colors",
        "gradients",
        "fonts",
        "fontSizes",
        "fontWeights",
        "lineHeights",
        "letterSpacings",
        "spacing",
        "sizes",
        "radii",
        "borders",
        "shadows",
        "blurs",
        "opacity",
        "durations",
        "easings",
        "animations",
        "breakpoints",
        "zIndex",
        "aspectRatios",
      ]
    `)
  })

  it('puts custom categories last, alphabetically', () => {
    expect(order(['spacing', 'icons', 'colors', 'avatars'])).toEqual(['colors', 'spacing', 'avatars', 'icons'])
  })
})

describe('remToPx', () => {
  it('rebases rem anywhere in a value, including inside clamp()', () => {
    expect(remToPx('1.125rem')).toBe('18px')
    expect(remToPx('clamp(1rem, 2vw, 2.5rem)')).toBe('clamp(16px, 2vw, 40px)')
  })

  it('leaves other units alone', () => {
    expect(remToPx('-0.025em')).toBe('-0.025em')
    expect(remToPx('1.5')).toBe('1.5')
  })
})

describe('aliasOf', () => {
  it('names the token a semantic radius points to', () => {
    expect(aliasOf(ds.view('radii').find((t) => t.name === 'l1')!)).toBe('radii.sm')
  })

  it('returns nothing for raw values and composite references', () => {
    expect(aliasOf({ originalValue: '0.25rem' })).toBeUndefined()
    expect(aliasOf({ originalValue: '1px solid {colors.neutral.200}' })).toBeUndefined()
  })
})
