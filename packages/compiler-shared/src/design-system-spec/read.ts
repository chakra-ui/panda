import type {
  DesignSystemPattern,
  DesignSystemRecipe,
  DesignSystemSlotRecipe,
  DesignSystemSpec,
  DesignSystemStyle,
  DesignSystemToken,
  DesignSystemValue,
} from './types'

/**
 * Outcome of reading a generated spec document. Parsing never throws: callers
 * reading files they did not generate get a message instead.
 */
export type SpecParseResult<T> = { ok: true; value: T } | { ok: false; error: string }

/**
 * Read `styled-system/specs/design-system.json`. Validation is shallow by design:
 * the tables are large, and walking every row to re-check types the emitter
 * guarantees would cost more than reading the document. Structure is checked;
 * rows are trusted.
 */
export function parseDesignSystem(input: string | unknown): SpecParseResult<DesignSystemSpec> {
  let json = input
  if (typeof input === 'string') {
    try {
      json = JSON.parse(input)
    } catch {
      return { ok: false, error: 'Not valid JSON.' }
    }
  }
  if (typeof json !== 'object' || json === null || Array.isArray(json)) {
    return { ok: false, error: 'Expected a design-system document object.' }
  }
  const doc = json as Partial<DesignSystemSpec>
  for (const key of ['categories', 'paths', 'tokens', 'values'] as const) {
    if (doc[key] == null) return { ok: false, error: `Expected a "${key}" table.` }
  }
  if (!Array.isArray(doc.paths)) return { ok: false, error: 'Expected "paths" to be an array.' }
  if (!Array.isArray(doc.values)) return { ok: false, error: 'Expected "values" to be an array.' }
  if (typeof doc.schemaVersion !== 'number') {
    return { ok: false, error: 'Expected a numeric "schemaVersion".' }
  }
  if (doc.schemaVersion > DESIGN_SYSTEM_SCHEMA_VERSION) {
    return {
      ok: false,
      error: `Document is schemaVersion ${doc.schemaVersion}; this build reads ${DESIGN_SYSTEM_SCHEMA_VERSION}. Upgrade @pandacss/compiler-shared.`,
    }
  }
  return { ok: true, value: doc as DesignSystemSpec }
}

/** The document shape this build understands. */
export const DESIGN_SYSTEM_SCHEMA_VERSION = 1

export interface ResolveOptions {
  condition?: string
  theme?: string
}

/** A token ready to render: metadata joined to its value under one variant. */
export interface TokenView extends DesignSystemToken {
  /** Full path, e.g. `colors.red.500`. What `referencesTo` and `resolve` take. */
  path: string
  /** Path within its category, e.g. `red.500`. What you type in `css({ ... })`. */
  name: string
  /** Resolved value under the requested variant, falling back to base. */
  value: string
  refs?: string[]
}

/**
 * A theme and condition combination that actually carries overrides. Which of
 * these to offer a user is the consumer's call; this only reports what exists.
 */
export interface Variant {
  theme?: string
  condition?: string
}

/**
 * Query surface over a parsed document.
 *
 * Presentation reads (`token`, `categoryPaths`) cost nothing — they hit the
 * keyed table and the precomputed ranges directly. Graph reads (`valuesFor`,
 * `resolve`, `referencesTo`, `unreferenced`) need an index over `values`, so
 * one is built on first use and reused after. A viewer that only renders never
 * pays for it.
 */
export interface DesignSystemIndex {
  readonly spec: DesignSystemSpec
  /** Category names in render order. */
  categories(): string[]
  /** Paths in one category — a slice, no grouping pass. */
  categoryPaths(category: string): string[]
  token(path: string): DesignSystemToken | undefined
  /** Every value row for a token: base, conditions and theme overrides. */
  valuesFor(path: string): DesignSystemValue[]
  /** The value for a token under a condition/theme, falling back to base. */
  resolve(path: string, options?: ResolveOptions): DesignSystemValue | undefined
  /** Token paths whose values point at `path` — the reverse edge. */
  referencesTo(path: string): string[]
  /** Tokens nothing references, optionally within one category. */
  unreferenced(category?: string): string[]
  /** A token's path within its category — `colors.red.500` becomes `red.500`. */
  name(path: string): string
  /** One category as render-ready rows, resolved under `variant`. */
  view(category: string, variant?: ResolveOptions): TokenView[]
  /** Theme/condition combinations that carry at least one override. */
  variants(): Variant[]
  /**
   * Every condition state of one token under a theme, base first. Tokens that
   * do not vary return a single row, so callers can render uniformly.
   */
  states(path: string, theme?: string): DesignSystemValue[]
  /** Recipes keyed by name. Empty when the system defines none. */
  recipes(): Record<string, DesignSystemRecipe>
  slotRecipes(): Record<string, DesignSystemSlotRecipe>
  patterns(): Record<string, DesignSystemPattern>
  keyframes(): string[]
  colorPalettes(): string[]
  /** `textStyles`, `layerStyles` or `animationStyles`, keyed by name. */
  composition(kind: CompositionKind): Record<string, DesignSystemStyle>
}

export type CompositionKind = 'textStyles' | 'layerStyles' | 'animationStyles'

export function indexDesignSystem(spec: DesignSystemSpec): DesignSystemIndex {
  let byToken: Map<string, DesignSystemValue[]> | undefined
  let refsTo: Map<string, string[]> | undefined

  // One pass builds both value indexes; neither is useful without the other.
  const build = () => {
    if (byToken) return
    const values = new Map<string, DesignSystemValue[]>()
    const refs = new Map<string, string[]>()
    for (const row of spec.values) {
      const list = values.get(row.token)
      if (list) list.push(row)
      else values.set(row.token, [row])
      if (!row.refs) continue
      for (const ref of row.refs) {
        const back = refs.get(ref)
        if (back) {
          if (!back.includes(row.token)) back.push(row.token)
        } else refs.set(ref, [row.token])
      }
    }
    byToken = values
    refsTo = refs
  }

  return {
    spec,

    categories: () => Object.keys(spec.categories),

    categoryPaths(category) {
      const range = spec.categories[category]
      return range ? spec.paths.slice(range[0], range[1]) : []
    },

    token: (path) => spec.tokens[path],

    recipes: () => spec.recipes ?? {},
    slotRecipes: () => spec.slotRecipes ?? {},
    patterns: () => spec.patterns ?? {},
    keyframes: () => spec.keyframes ?? [],
    colorPalettes: () => spec.colorPalettes ?? [],
    composition: (kind) => spec[kind] ?? {},

    valuesFor(path) {
      build()
      return byToken!.get(path) ?? []
    },

    resolve(path, options = {}) {
      build()
      const rows = byToken!.get(path)
      if (!rows) return undefined
      const { condition, theme } = options
      return (
        rows.find((row) => row.condition === condition && row.theme === theme) ??
        // A theme that does not override this condition falls back to the
        // plain conditional value, then to base.
        (condition ? rows.find((row) => row.condition === condition && !row.theme) : undefined) ??
        rows.find((row) => !row.condition && !row.theme)
      )
    },

    referencesTo(path) {
      build()
      return refsTo!.get(path) ?? []
    },

    unreferenced(category) {
      build()
      const paths = category ? this.categoryPaths(category) : spec.paths
      return paths.filter((path) => !refsTo!.has(path))
    },

    name(path) {
      const category = spec.tokens[path]?.category
      return category && path.startsWith(`${category}.`) ? path.slice(category.length + 1) : path
    },

    view(category, variant) {
      const rows: TokenView[] = []
      for (const path of this.categoryPaths(category)) {
        const token = spec.tokens[path]
        if (!token) continue
        const resolved = this.resolve(path, variant)
        if (!resolved) continue
        rows.push({ ...token, path, name: this.name(path), value: resolved.value, refs: resolved.refs })
      }
      return rows
    },

    states(path, theme) {
      build()
      const rows = byToken!.get(path)
      if (!rows) return []
      const conditions: (string | undefined)[] = [undefined]
      for (const row of rows) {
        if (row.condition && !conditions.includes(row.condition)) conditions.push(row.condition)
      }
      const out: DesignSystemValue[] = []
      for (const condition of conditions) {
        const resolved = this.resolve(path, { condition, theme })
        // A theme may not override every condition; `resolve` falls back, which
        // would otherwise repeat the base row under each condition.
        if (resolved && !out.some((seen) => seen === resolved)) out.push(resolved)
      }
      return out
    },

    variants() {
      const seen = new Set<string>()
      const out: Variant[] = []
      for (const row of spec.values) {
        if (!row.theme && !row.condition) continue
        const key = `${row.theme ?? ''}\u0000${row.condition ?? ''}`
        if (seen.has(key)) continue
        seen.add(key)
        out.push({ ...(row.theme ? { theme: row.theme } : {}), ...(row.condition ? { condition: row.condition } : {}) })
      }
      return out
    },
  }
}
