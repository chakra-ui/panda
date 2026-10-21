import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseSpec } from './design-system'
import { specToConfig } from './spec-config'

const raw = readFileSync(new URL('../public/sample-design-system.json', import.meta.url), 'utf8')
const parsed = parseSpec(raw)
if (!parsed.ok) throw new Error(parsed.error)
const config = specToConfig(parsed.spec)
const theme = config.theme as { tokens: any; semanticTokens: any; breakpoints: Record<string, string> }

describe('specToConfig', () => {
  it('rebuilds core tokens with their resolved values', () => {
    expect(theme.tokens.radii.sm).toEqual({ value: '0.25rem' })
    expect(theme.tokens.colors.brand['500']).toEqual({ value: '#6366f1' })
  })

  it('rebuilds semantic tokens with their condition values', () => {
    expect(theme.semanticTokens.colors.bg.canvas).toEqual({ value: { base: '#fff', _dark: 'oklch(14.5% 0 0)' } })
  })

  it('keeps a DEFAULT token next to its nested tokens', () => {
    expect(Object.keys(theme.semanticTokens.colors.fg)).toEqual(
      expect.arrayContaining(['DEFAULT', 'muted', 'subtle', 'disabled', 'inverted']),
    )
  })

  it('carries theme overrides and breakpoints', () => {
    expect(Object.keys(config.themes)).toEqual(['ocean', 'rose'])
    expect(theme.breakpoints.md).toBe('48rem')
  })

  it('carries custom conditions without the underscore', () => {
    expect(config.conditions.dark).toBeTypeOf('string')
  })
})
