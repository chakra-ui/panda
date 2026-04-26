import { createContext } from '@pandacss/fixture'
import { describe, expect, test } from 'vitest'
import { generateConditionsSpec } from '../src/spec/conditions'

describe('generateConditionsSpec', () => {
  test('renders multi-block (object) conditions as semicolon-separated paths, not JSON', () => {
    const ctx = createContext({
      eject: true,
      conditions: {
        hoverActive: {
          '@media (hover: hover)': { '&:is(:hover, [data-hover])': '@slot' },
          '@media (hover: none)': { '&:is(:active, [data-active])': '@slot' },
        },
      },
    })

    const spec = generateConditionsSpec(ctx)
    const entry = spec.data.find((c) => c.name === '_hoverActive')
    expect(entry?.value).toMatchInlineSnapshot(
      `"@media (hover: hover) &:is(:hover, [data-hover]); @media (hover: none) &:is(:active, [data-active])"`,
    )
    // Must not be the raw JSON fallback
    expect(entry?.value).not.toContain('"@slot"')
    expect(entry?.value).not.toMatch(/^{/)
  })

  test('renders string and array conditions unchanged', () => {
    const ctx = createContext({
      eject: true,
      conditions: {
        hover: '&:hover',
        anyHover: ['@media (hover: hover)', '&:hover'],
      },
    })

    const spec = generateConditionsSpec(ctx)
    const hover = spec.data.find((c) => c.name === '_hover')
    const anyHover = spec.data.find((c) => c.name === '_anyHover')
    expect(hover?.value).toBe('&:hover')
    expect(anyHover?.value).toBe('@media (hover: hover), &:hover')
  })
})
