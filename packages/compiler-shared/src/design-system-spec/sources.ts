/**
 * Records which config or preset defined each entry in the design system spec.
 *
 * The tracker keys every config path it saw (`theme.tokens.colors.red.500`, and
 * again for `.value`); the spec keys tokens by their own path. This narrows the
 * tracker's entries to one origin per row, written as a `source` index into
 * {@link DesignSystemSources.entries} — the same foreign-key shape `values`
 * already uses to point at `conditions`.
 */

import type { DesignSystemSourceEntry, DesignSystemSpec } from './types'

/** The `ConfigSources` shape `@pandacss/config` produces under `trackSources`. */
export interface ConfigSourcesInput {
  entries: DesignSystemSourceEntry[]
  paths: Record<string, number | number[]>
}

type Lookup = (key: string) => number | undefined

const TOKEN_SECTION = /^theme\.(tokens|semanticTokens)\./
const CONDITION_PREFIX = /^_/

export function applySpecSources(spec: DesignSystemSpec, sources: ConfigSourcesInput | undefined): DesignSystemSpec {
  if (!sources?.entries.length) return spec

  const tokenDefinitions = new Map<string, string>()
  for (const path of Object.keys(sources.paths)) {
    if (!TOKEN_SECTION.test(path) || !path.endsWith('.value')) continue
    const normalized = path
      .split('.')
      .slice(0, -1)
      .filter((segment) => segment !== 'DEFAULT')
      .join('.')
    tokenDefinitions.set(normalized, path)
  }

  const lookup: Lookup = (key) => {
    const found = sources.paths[tokenDefinitions.get(key) ?? key]
    if (found === undefined) return undefined
    // A path several configs wrote belongs to the last one that touched it.
    return Array.isArray(found) ? found[found.length - 1] : found
  }

  const conditions = mapKeys(Object.keys(spec.conditions), (name) =>
    lookup(`conditions.${name.replace(CONDITION_PREFIX, '')}`),
  )

  return {
    ...spec,
    tokens: withSource(spec.tokens, (path, token) => tokenSource(path, token.semantic, lookup)),
    themes: withSource(spec.themes, (name) => lookup(`themes.${name}`)),
    sources: { entries: sources.entries, ...(conditions ? { conditions } : {}) },
  }
}

function withSource<T extends object>(
  rows: Record<string, T>,
  resolve: (key: string, row: T) => number | undefined,
): Record<string, T & { source?: number }> {
  return Object.fromEntries(
    Object.entries(rows).map(([key, row]) => {
      const source = resolve(key, row)
      return [key, source === undefined ? row : { ...row, source }]
    }),
  )
}

function tokenSource(path: string, semantic: boolean | undefined, lookup: Lookup): number | undefined {
  const first = semantic ? `theme.semanticTokens.${path}` : `theme.tokens.${path}`
  const second = semantic ? `theme.tokens.${path}` : `theme.semanticTokens.${path}`

  return (
    lookup(first) ??
    lookup(second) ??
    // `theme.breakpoints` and `theme.containers` become token categories of the same name
    lookup(`theme.${path}`) ??
    breakpointSource(path, lookup) ??
    derivedSource(path, lookup)
  )
}

/** Each breakpoint also lands in `sizes` as `breakpoint-<name>`. */
function breakpointSource(path: string, lookup: Lookup): number | undefined {
  const name = path.startsWith('sizes.breakpoint-') ? path.slice('sizes.breakpoint-'.length) : undefined
  return name ? lookup(`theme.breakpoints.${name}`) : undefined
}

/** `spacing.-4` is generated from `spacing.4`, so it inherits its origin. */
function derivedSource(path: string, lookup: Lookup): number | undefined {
  const index = path.lastIndexOf('.-')
  if (index === -1) return undefined

  const positive = `${path.slice(0, index + 1)}${path.slice(index + 2)}`
  return lookup(`theme.tokens.${positive}`) ?? lookup(`theme.semanticTokens.${positive}`)
}

function mapKeys(keys: string[], resolve: Lookup): Record<string, number> | undefined {
  const out: Record<string, number> = {}
  for (const key of keys) {
    const source = resolve(key)
    if (source !== undefined) out[key] = source
  }
  return Object.keys(out).length > 0 ? out : undefined
}
