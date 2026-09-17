import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { indexDesignSystem, parseDesignSystem } from '../src'
import type { DesignSystemSpec } from '../src'

const here = dirname(fileURLToPath(import.meta.url))

/**
 * A document the Rust codegen emitted, captured here. `schemaVersion` is the
 * contract between the two: a shape change bumps it, and both suites assert on
 * it, so this fixture cannot quietly fall behind the emitter.
 */
const raw = readFileSync(join(here, 'fixtures', 'design-system.json'), 'utf8')

const load = () => {
  const result = parseDesignSystem(raw)
  if (!result.ok) throw new Error(result.error)
  return indexDesignSystem(result.value)
}

describe('reading a design system a project generated', () => {
  it('parses the document the Rust codegen emits', () => {
    const result = parseDesignSystem(raw)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.schemaVersion).toBe(1)
    expect(Object.keys(result.value.categories)).toMatchInlineSnapshot(`
      [
        "colors",
        "spacing",
      ]
    `)
  })

  it('renders a category by slicing a range instead of grouping every token', () => {
    const ds = load()

    // Config order, not alphabetical: `spacing.4` before the `-4` derived from it.
    expect(ds.categoryPaths('colors')).toMatchInlineSnapshot(`
      [
        "colors.red.500",
        "colors.blue.600",
        "colors.fg",
      ]
    `)
    expect(ds.categoryPaths('spacing')).toMatchInlineSnapshot(`
      [
        "spacing.4",
        "spacing.-4",
      ]
    `)
  })

  it('returns nothing for a category the system does not define', () => {
    expect(load().categoryPaths('shadows')).toEqual([])
  })

  it('looks a token up by path without building an index', () => {
    const ds = load()

    expect(ds.token('colors.fg')).toMatchInlineSnapshot(`
      {
        "category": "colors",
        "cssVar": "--colors-fg",
        "originalValue": "{colors.red.500}",
        "semantic": true,
      }
    `)
  })

  it('omits the css variable for derived tokens that have none', () => {
    const ds = load()

    expect(ds.token('spacing.-4')?.cssVar).toBeUndefined()
    expect(ds.token('spacing.4')?.cssVar).toBe('--spacing-4')
  })

  it('exposes retained original values through token metadata and views', () => {
    const ds = load()

    expect({
      semantic: ds.token('colors.fg')?.originalValue,
      derived: ds.token('spacing.-4')?.originalValue,
      primitive: ds.token('colors.red.500')?.originalValue,
      dark: ds.view('colors', { condition: '_dark' }).find((token) => token.path === 'colors.fg'),
    }).toMatchInlineSnapshot(`
      {
        "dark": {
          "category": "colors",
          "cssVar": "--colors-fg",
          "name": "fg",
          "originalValue": "{colors.red.500}",
          "path": "colors.fg",
          "refs": [
            "colors.blue.600",
          ],
          "semantic": true,
          "value": "#2563eb",
        },
        "derived": "1rem",
        "primitive": undefined,
        "semantic": "{colors.red.500}",
      }
    `)
  })
})

describe('following the reference graph the old spec threw away', () => {
  it('keeps the token a semantic token points at', () => {
    const ds = load()

    expect(ds.resolve('colors.fg')).toMatchInlineSnapshot(`
      {
        "refs": [
          "colors.red.500",
        ],
        "token": "colors.fg",
        "value": "#ef4444",
      }
    `)
  })

  it('answers what would break if a primitive changed', () => {
    const ds = load()

    expect(ds.referencesTo('colors.red.500')).toEqual(['colors.fg'])
    expect(ds.referencesTo('colors.blue.600')).toEqual(['colors.fg'])
  })

  it('finds tokens nothing points at, for a deprecation pass', () => {
    const ds = load()

    expect(ds.unreferenced('colors')).toEqual(['colors.fg'])
  })

  it('reports no references for a token nothing uses', () => {
    expect(load().referencesTo('spacing.4')).toEqual(['spacing.-4'])
  })
})

describe('joining a value row back to its definition', () => {
  it('keys conditions the way value rows name them', () => {
    const ds = load()

    const conditions = ds.spec.values.flatMap((row) => (row.condition ? [row.condition] : []))
    expect(conditions.length).toBeGreaterThan(0)
    for (const condition of conditions) {
      expect(ds.spec.conditions, `condition "${condition}" has no definition`).toHaveProperty(condition)
    }
  })

  it('keys themes the way value rows name them', () => {
    const ds = load()

    const themes = ds.spec.values.flatMap((row) => (row.theme ? [row.theme] : []))
    expect(themes).toContain('brand')
    for (const theme of themes) expect(ds.spec.themes).toHaveProperty(theme)
  })

  it('points every ref at a token the document defines', () => {
    const ds = load()

    for (const row of ds.spec.values) {
      for (const ref of row.refs ?? []) {
        expect(ds.token(ref), `ref "${ref}" is dangling`).toBeDefined()
      }
    }
  })
})

describe('resolving a token under a condition or theme', () => {
  it('picks the conditional value when one exists', () => {
    const ds = load()

    expect(ds.resolve('colors.fg', { condition: '_dark' })?.value).toBe('#2563eb')
  })

  it('picks the theme override, which the CSS blob used to hide', () => {
    const ds = load()

    expect(ds.resolve('colors.fg', { theme: 'brand' })).toMatchInlineSnapshot(`
      {
        "refs": [
          "colors.blue.600",
        ],
        "theme": "brand",
        "token": "colors.fg",
        "value": "#2563eb",
      }
    `)
  })

  it('falls back to the plain conditional value when a theme does not override it', () => {
    const ds = load()

    expect(ds.resolve('colors.fg', { condition: '_dark', theme: 'brand' })?.value).toBe('#2563eb')
  })

  it('falls back to the base value when neither matches', () => {
    const ds = load()

    expect(ds.resolve('colors.fg', { condition: '_print' })?.value).toBe('#ef4444')
  })

  it('returns nothing for a token that does not exist', () => {
    expect(load().resolve('colors.nope')).toBeUndefined()
  })
})

describe('reading a document this build cannot understand', () => {
  it('refuses a newer schema rather than misreading it', () => {
    const doc = { ...JSON.parse(raw), schemaVersion: 99 }

    expect(parseDesignSystem(doc)).toMatchInlineSnapshot(`
      {
        "error": "Document is schemaVersion 99; this build reads 1. Upgrade @pandacss/compiler-shared.",
        "ok": false,
      }
    `)
  })

  it('reports malformed JSON without throwing', () => {
    expect(parseDesignSystem('{ not json')).toMatchInlineSnapshot(`
      {
        "error": "Not valid JSON.",
        "ok": false,
      }
    `)
  })

  it('names the table that is missing', () => {
    expect(parseDesignSystem('{"schemaVersion":1,"categories":{},"paths":[]}')).toMatchInlineSnapshot(`
      {
        "error": "Expected a "tokens" table.",
        "ok": false,
      }
    `)
  })

  it('rejects a plain tokens.json handed to the wrong parser', () => {
    expect(parseDesignSystem('{"data":[]}').ok).toBe(false)
  })
})

describe('presenting a category to a user', () => {
  it('returns render-ready rows in one call', () => {
    const ds = load()

    expect(ds.view('spacing')).toMatchInlineSnapshot(`
      [
        {
          "category": "spacing",
          "cssVar": "--spacing-4",
          "description": "one rem",
          "name": "4",
          "path": "spacing.4",
          "refs": undefined,
          "value": "1rem",
        },
        {
          "category": "spacing",
          "description": "one rem",
          "name": "-4",
          "originalValue": "1rem",
          "path": "spacing.-4",
          "refs": [
            "spacing.4",
          ],
          "value": "calc(1rem * -1)",
        },
      ]
    `)
  })

  it('gives the name you would type in css(), not the full path', () => {
    const ds = load()

    expect(ds.name('colors.red.500')).toBe('red.500')
    expect(ds.view('colors').map((t) => t.name)).toEqual(['red.500', 'blue.600', 'fg'])
  })

  it('repaints the same category under a theme', () => {
    const ds = load()

    const base = ds.view('colors').find((t) => t.name === 'fg')
    const themed = ds.view('colors', { theme: 'brand' }).find((t) => t.name === 'fg')
    expect(base?.value).toBe('#ef4444')
    expect(themed?.value).toBe('#2563eb')
  })

  it('leaves tokens a theme does not override at their base value', () => {
    const ds = load()

    const themed = ds.view('colors', { theme: 'brand' }).find((t) => t.name === 'red.500')
    expect(themed?.value).toBe('#ef4444')
  })

  it('lists every condition state of a token, base first', () => {
    const ds = load()

    expect(ds.states('colors.fg')).toMatchInlineSnapshot(`
      [
        {
          "refs": [
            "colors.red.500",
          ],
          "token": "colors.fg",
          "value": "#ef4444",
        },
        {
          "condition": "_dark",
          "refs": [
            "colors.blue.600",
          ],
          "token": "colors.fg",
          "value": "#2563eb",
        },
      ]
    `)
  })

  it('returns a single state for a token that does not vary', () => {
    const ds = load()

    expect(ds.states('colors.red.500')).toHaveLength(1)
  })

  it('resolves states within the selected theme', () => {
    const ds = load()

    expect(ds.states('colors.fg', 'brand').map((s) => s.value)).toEqual(['#2563eb', '#2563eb'])
  })

  it('reports only the variants that carry overrides', () => {
    const ds = load()

    expect(ds.variants()).toMatchInlineSnapshot(`
      [
        {
          "condition": "_dark",
        },
        {
          "theme": "brand",
        },
      ]
    `)
  })

  it('marks semantic tokens without sniffing their value', () => {
    const ds = load()

    const semantic = ds.view('colors').filter((t) => t.semantic)
    expect(semantic.map((t) => t.name)).toEqual(['fg'])
  })
})

describe('a design system far larger than any real one', () => {
  /** 20k tokens across 10 categories, 15% semantic with conditions and themes. */
  const large = (): DesignSystemSpec => {
    const categories: Record<string, [number, number]> = {}
    const paths: string[] = []
    const tokens: Record<string, { category: string; cssVar: string }> = {}
    const values: DesignSystemSpec['values'] = []
    const names = ['colors', 'spacing', 'sizes', 'fontSizes', 'radii', 'shadows', 'borders', 'blurs', 'zIndex', 'fonts']

    for (const category of names) {
      const from = paths.length
      for (let i = 0; i < 2000; i++) {
        const path = `${category}.${i}`
        paths.push(path)
        tokens[path] = { category, cssVar: `--${category}-${i}` }
        values.push({ token: path, value: `v${i}` })
      }
      categories[category] = [from, paths.length]
    }
    // Semantic tokens pointing back at primitives, with a condition and a theme.
    for (let i = 0; i < 3000; i++) {
      const path = `colors.semantic.${i}`
      const target = `colors.${i % 2000}`
      paths.push(path)
      tokens[path] = { category: 'colors', cssVar: `--colors-semantic-${i}` }
      values.push({ token: path, value: `s${i}`, refs: [target] })
      values.push({ token: path, condition: '_dark', value: `d${i}`, refs: [`colors.${(i * 7) % 2000}`] })
      if (i % 5 === 0) values.push({ token: path, theme: 'brand', value: `b${i}`, refs: [target] })
    }
    return { schemaVersion: 1, categories, paths, tokens, conditions: {}, themes: {}, values }
  }

  it('renders a category without touching the value table', () => {
    const ds = indexDesignSystem(large())

    const colors = ds.categoryPaths('colors')
    expect(colors).toHaveLength(2000)
    expect(colors[0]).toBe('colors.0')
    expect(ds.token(colors[1999]!)?.cssVar).toBe('--colors-1999')
  })

  it('answers reverse-reference queries over 26k value rows', () => {
    const spec = large()
    const ds = indexDesignSystem(spec)

    expect(spec.values).toHaveLength(26_600)
    // colors.0 is the base target of every 2000th semantic token, plus _dark hits.
    expect(ds.referencesTo('colors.0').length).toBeGreaterThan(0)
    expect(ds.referencesTo('colors.0').every((p) => p.startsWith('colors.semantic.'))).toBe(true)
  })

  it('resolves a token under a theme at the far end of the table', () => {
    const ds = indexDesignSystem(large())

    expect(ds.resolve('colors.semantic.2995', { theme: 'brand' })?.value).toBe('b2995')
    expect(ds.resolve('colors.semantic.2999', { theme: 'brand' })?.value).toBe('s2999')
  })
})

/** The same emitter on a system with recipes, patterns and composition styles. */
const richRaw = readFileSync(join(here, 'fixtures', 'design-system-rich.json'), 'utf8')

const loadRich = () => {
  const result = parseDesignSystem(richRaw)
  if (!result.ok) throw new Error(result.error)
  return indexDesignSystem(result.value)
}

describe('listing recipes, patterns and composition styles', () => {
  it('lists a recipe with its variants, defaults and deprecation', () => {
    expect(loadRich().recipes()).toMatchInlineSnapshot(`
      {
        "button": {
          "className": "btn",
          "defaultVariants": {
            "size": "md",
          },
          "deprecated": "use link",
          "description": "The primary action",
          "variants": {
            "disabled": {
              "allowsBoolean": true,
              "values": [
                "true",
              ],
            },
            "size": {
              "allowsBoolean": false,
              "values": [
                "md",
                "sm",
              ],
            },
          },
        },
      }
    `)
  })

  it('lists a slot recipe with its slots', () => {
    expect(loadRich().slotRecipes()).toMatchInlineSnapshot(`
      {
        "card": {
          "slots": [
            "root",
            "body",
          ],
          "variants": {
            "tone": {
              "allowsBoolean": false,
              "values": [
                "neutral",
              ],
            },
          },
        },
      }
    `)
  })

  it('lists a pattern with the property kinds typegen resolved', () => {
    expect(loadRich().patterns()).toMatchInlineSnapshot(`
      {
        "stack": {
          "defaultValues": {
            "gap": "4",
          },
          "description": "Vertical flow",
          "jsx": [
            "VStack",
          ],
          "jsxName": "VStack",
          "properties": {
            "align": {
              "kind": "enum",
              "values": [
                "start",
                "center",
              ],
            },
            "gap": {
              "category": "spacing",
              "description": "Space between",
              "kind": "token",
            },
            "wrap": {
              "kind": "primitive",
              "primitive": "boolean",
            },
          },
          "strict": false,
        },
      }
    `)
  })

  it('flattens nested composition styles to dotted names', () => {
    const ds = loadRich()

    expect({
      text: ds.composition('textStyles'),
      layer: ds.composition('layerStyles'),
      animation: ds.composition('animationStyles'),
      keyframes: ds.keyframes(),
      palettes: ds.colorPalettes(),
    }).toMatchInlineSnapshot(`
      {
        "animation": {
          "fade": {},
        },
        "keyframes": [
          "spin",
        ],
        "layer": {
          "card": {},
        },
        "palettes": [
          "red",
        ],
        "text": {
          "body": {
            "description": "Paragraph copy",
          },
          "heading.lg": {},
        },
      }
    `)
  })

  it('reads as empty on a token-only system', () => {
    const ds = load()

    expect({
      recipes: ds.recipes(),
      slotRecipes: ds.slotRecipes(),
      patterns: ds.patterns(),
      keyframes: ds.keyframes(),
      palettes: ds.colorPalettes(),
      text: ds.composition('textStyles'),
    }).toMatchInlineSnapshot(`
      {
        "keyframes": [],
        "palettes": [],
        "patterns": {},
        "recipes": {},
        "slotRecipes": {},
        "text": {},
      }
    `)
  })
})
