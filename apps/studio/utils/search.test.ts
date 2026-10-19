import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { index, parseSpec } from './design-system'
import { buildSearchIndex, excerpt, searchDesignSystem } from './search'

const raw = readFileSync(new URL('../public/sample-design-system.json', import.meta.url), 'utf8')
const parsed = parseSpec(raw)
if (!parsed.ok) throw new Error(parsed.error)
const entries = buildSearchIndex(index(parsed.spec))

const top = (query: string, count = 3) =>
  searchDesignSystem(entries, query)
    .slice(0, count)
    .map((hit) => [hit.entry.kind, hit.entry.label, hit.match?.label].filter(Boolean).join(' | '))

describe('searchDesignSystem', () => {
  it('finds nothing for an empty query', () => {
    expect(searchDesignSystem(entries, '   ')).toEqual([])
  })

  it('ranks an exact token path first when typing a full path', () => {
    expect(top('colors.blue.500', 1)).toMatchInlineSnapshot(`
      [
        "token | colors.blue.500",
      ]
    `)
  })

  it('matches a token name typed without its category', () => {
    expect(top('blue.500', 1)).toMatchInlineSnapshot(`
      [
        "token | colors.blue.500",
      ]
    `)
  })

  it('finds a token by its raw value and reports the value field', () => {
    const hit = searchDesignSystem(entries, '1.618 / 1')[0]
    expect(hit.entry.label).toBe('aspectRatios.golden')
    expect(hit.match).toEqual({ label: 'value', text: '1.618 / 1' })
  })

  it('finds a semantic token by its dark-mode value', () => {
    const hit = searchDesignSystem(entries, '#818cf8').find((h) => h.entry.label === 'colors.accent.solid')
    expect(hit?.match?.label).toBe('_dark')
  })

  it('finds tokens that reference another token', () => {
    const labels = searchDesignSystem(entries, 'colors.brand.600', 200).map((h) => h.entry.label)
    expect(labels).toContain('colors.accent.solid')
  })

  it('finds a condition by the selector it compiles to', () => {
    expect(top('any-pointer: coarse', 1)).toMatchInlineSnapshot(`
      [
        "condition | _anyPointerCoarse | query",
      ]
    `)
  })

  it('puts the theme itself above tokens that override it', () => {
    expect(top('ocean', 2)).toMatchInlineSnapshot(`
      [
        "theme | ocean",
        "token | colors.accent.fg | themes",
      ]
    `)
  })

  it('requires every term to match somewhere', () => {
    const hits = searchDesignSystem(entries, 'spacing 4', 200)
    expect(hits.length).toBeGreaterThan(0)
    expect(hits.every((h) => h.entry.fields.some((f) => f.lower.includes('spacing')))).toBe(true)
  })

  it('jumps to a category by name', () => {
    expect(top('shadows', 1)).toMatchInlineSnapshot(`
      [
        "category | shadows",
      ]
    `)
  })

  it('carries the base colour so results can show a swatch', () => {
    const hit = searchDesignSystem(entries, 'colors.blue.500')[0]
    expect(hit.entry.color).toMatch(/^oklch\(/)
  })
})

describe('excerpt', () => {
  it('starts a long value near the match', () => {
    expect(excerpt('[data-theme=dark] &:is(:hover, [data-hover])', 'hover')).toBe(
      '…eme=dark] &:is(:hover, [data-hover])',
    )
  })

  it('keeps a short value whole', () => {
    expect(excerpt('1.618 / 1', '1.618')).toBe('1.618 / 1')
  })
})
