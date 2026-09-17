import { describe, expect, it } from 'vitest'
import { applySpecSources, type ConfigSourcesInput } from '../src'
import type { DesignSystemSpec } from '../src'

const entries: ConfigSourcesInput['entries'] = [
  { kind: 'preset', name: '@pandacss/preset-panda', file: 'preset-panda/index.mjs' },
  { kind: 'config', file: 'panda.config.ts' },
]

function spec(paths: string[], overrides: Partial<DesignSystemSpec> = {}): DesignSystemSpec {
  return {
    schemaVersion: 1,
    categories: {},
    paths,
    tokens: Object.fromEntries(paths.map((path) => [path, { category: path.split('.')[0]! }])),
    conditions: {},
    themes: {},
    values: [],
    ...overrides,
  }
}

/** The origin of one token, read the way a consumer would. */
function owner(result: DesignSystemSpec, path: string) {
  const source = result.tokens[path]?.source
  return source === undefined ? undefined : result.sources?.entries[source]
}

describe('spec provenance', () => {
  it('says which preset or config defined each token', () => {
    const result = applySpecSources(spec(['colors.red.500', 'colors.brand']), {
      entries,
      paths: { 'theme.tokens.colors.red.500': 0, 'theme.tokens.colors.brand': 1 },
    })

    expect(owner(result, 'colors.red.500')?.name).toBe('@pandacss/preset-panda')
    expect(owner(result, 'colors.brand')?.file).toBe('panda.config.ts')
  })

  it('looks a semantic token up under semanticTokens', () => {
    const doc = spec(['colors.fg'], { tokens: { 'colors.fg': { category: 'colors', semantic: true } } })
    const result = applySpecSources(doc, { entries, paths: { 'theme.semanticTokens.colors.fg': 1 } })

    expect(result.tokens['colors.fg']?.source).toBe(1)
  })

  it('credits a negative token to the one it is derived from', () => {
    const result = applySpecSources(spec(['spacing.-4']), { entries, paths: { 'theme.tokens.spacing.4': 0 } })

    expect(result.tokens['spacing.-4']?.source).toBe(0)
  })

  it('credits breakpoints and their sizes aliases to theme.breakpoints', () => {
    const result = applySpecSources(spec(['breakpoints.sm', 'sizes.breakpoint-sm']), {
      entries,
      paths: { 'theme.breakpoints.sm': 0 },
    })

    expect(result.tokens['breakpoints.sm']?.source).toBe(0)
    expect(result.tokens['sizes.breakpoint-sm']?.source).toBe(0)
  })

  it('leaves source off a token it cannot place rather than guessing', () => {
    const result = applySpecSources(spec(['colors.mystery']), { entries, paths: {} })

    expect(result.tokens['colors.mystery']).toMatchInlineSnapshot(`
      {
        "category": "colors",
      }
    `)
  })

  it('credits a path several configs wrote to the last one that touched it', () => {
    const result = applySpecSources(spec(['colors.red.500']), {
      entries,
      paths: { 'theme.tokens.colors.red.500': [0, 1] },
    })

    expect(result.tokens['colors.red.500']?.source).toBe(1)
  })

  it('maps conditions back to their unprefixed config key', () => {
    const doc = spec([], { conditions: { _dark: '[data-theme=dark] &' } })
    const result = applySpecSources(doc, { entries, paths: { 'conditions.dark': 1 } })

    expect(result.sources?.conditions).toEqual({ _dark: 1 })
  })

  it('puts a theme origin on the theme row', () => {
    const doc = spec([], { themes: { brand: { id: 'panda-theme-brand', selector: '[data-panda-theme=brand]' } } })
    const result = applySpecSources(doc, { entries, paths: { 'themes.brand': 0 } })

    expect(result.themes.brand?.source).toBe(0)
  })

  it('returns the document untouched when the host never tracked sources', () => {
    const doc = spec(['colors.red.500'])

    expect(applySpecSources(doc, undefined)).toBe(doc)
    expect(applySpecSources(doc, { entries: [], paths: {} })).toBe(doc)
  })
})
