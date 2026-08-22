import type { SemanticTokenEntry, Spec } from '@pandacss/compiler-shared'
import type { StudioToken } from './types'

const NEGATED = /^calc\(var\(--([^)]+)\)\s*\*\s*-1\)$/

export function buildTokensSnapshot(spec: Spec, semantic: Record<string, Record<string, string>> = {}): StudioToken[] {
  const out: StudioToken[] = []
  for (const [category, meta] of Object.entries(spec.tokens.categories)) {
    for (const name of meta.values) {
      const path = `${category}.${name}`
      if (semantic[path]) continue
      let value = spec.tokens.values[path]
      if (value == null || value === '') continue
      const negated = value.match(NEGATED)
      if (negated) {
        const positivePath = negated[1].replace(/\\/g, '').replace('-', '.')
        const positive = spec.tokens.values[positivePath]
        if (positive) value = `-${positive}`
      }
      const token: StudioToken = { category, path, name, value }
      const deprecated = spec.tokens.deprecated?.[path]
      if (deprecated) token.deprecated = deprecated
      out.push(token)
    }
  }
  for (const [path, conditions] of Object.entries(semantic)) {
    const dot = path.indexOf('.')
    const category = dot === -1 ? path : path.slice(0, dot)
    const name = dot === -1 ? path : path.slice(dot + 1)
    const value = conditions.base ?? Object.values(conditions)[0]
    if (value == null || value === '') continue
    const token: StudioToken = { category, path, name, value, conditions }
    const deprecated = spec.tokens.deprecated?.[path]
    if (deprecated) token.deprecated = deprecated
    out.push(token)
  }
  return out
}

export function semanticMapFromTokens(entries: SemanticTokenEntry[] = []): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {}
  for (const entry of entries) {
    const conditions: Record<string, string> = {}
    for (const { theme, condition, value } of entry.conditions) {
      conditions[theme ? `${theme} · ${condition}` : condition] = value
    }
    out[entry.path] = conditions
  }
  return out
}
