import type { SemanticTokenEntry, Spec } from '@pandacss/compiler-shared'

export interface StudioToken {
  category: string
  path: string
  name: string
  value: string
  conditions?: Record<string, string>
}

export interface StudioRuntime {
  getTokenJson: (opts?: { category?: string; query?: string }) => StudioToken[]
  getTokenHtml: (opts?: { tokens?: StudioToken[]; category?: string; query?: string }) => string
  getTokenCss: (css?: string) => string
}

export interface StudioFile {
  path: string
  code: string
}

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
      out.push({ category, path, name, value })
    }
  }
  for (const [path, conditions] of Object.entries(semantic)) {
    const dot = path.indexOf('.')
    const category = dot === -1 ? path : path.slice(0, dot)
    const name = dot === -1 ? path : path.slice(dot + 1)
    const value = conditions.base ?? Object.values(conditions)[0]
    if (value == null || value === '') continue
    out.push({ category, path, name, value, conditions })
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

export function createStudioRuntime(tokens: StudioToken[]): StudioRuntime {
  const esc = (value: string) =>
    String(value).replace(/[&<>"]/g, (c) => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&quot;'))

  const filter = (opts: { category?: string; query?: string } = {}) => {
    const term = (opts.query ?? '').trim().toLowerCase()
    return tokens
      .filter((t) => (opts.category ? t.category === opts.category : true))
      .filter((t) => !term || `${t.name} ${t.value} ${t.category}`.toLowerCase().includes(term))
  }

  const renderToken = (t: StudioToken) => {
    const attrs = `data-category="${esc(t.category)}" data-name="${esc(t.name)}" data-value="${esc(t.value)}"`
    if (t.conditions) {
      const conds = Object.entries(t.conditions)
        .map(
          ([cond, value]) =>
            `<div class="pds-condition" data-condition="${esc(cond)}" data-value="${esc(value)}"><span class="pds-condition__name">${esc(cond)}</span><code class="pds-condition__value">${esc(value)}</code></div>`,
        )
        .join('')
      return `<li class="pds-token pds-token--semantic" ${attrs}><span class="pds-token__name">${esc(t.name)}</span><div class="pds-conditions">${conds}</div></li>`
    }
    return `<li class="pds-token" ${attrs}><span class="pds-token__name">${esc(t.name)}</span><code class="pds-token__value">${esc(t.value)}</code></li>`
  }

  const getTokenCss: StudioRuntime['getTokenCss'] = (css = '') => {
    const values = new Set<string>()
    for (const t of tokens) {
      if (t.conditions) for (const value of Object.values(t.conditions)) values.add(value)
      else values.add(t.value)
    }
    const vars = [...values]
      .filter((value) => !/[{}<>;"]/.test(value))
      .map((value) => `[data-value="${value}"]{--pds-value:${value}}`)
      .join('')
    return `${vars}${css}`
  }

  const getTokenJson: StudioRuntime['getTokenJson'] = (opts = {}) => filter(opts)

  const UNIT_PX: Record<string, number> = { '': 1, px: 1, rem: 16, em: 16, ch: 8, ex: 8, '%': 16, vw: 16, vh: 16 }
  const metered = new Set(['spacing', 'sizes'])
  const toPx = (value: string) => {
    const m = String(value).match(/^(-?[0-9.]+)\s*([a-z%]*)$/i)
    if (!m) return NaN
    const n = parseFloat(m[1])
    const factor = UNIT_PX[m[2].toLowerCase()]
    return Number.isFinite(n) && factor != null ? n * factor : NaN
  }
  const sortKey = (t: StudioToken) => {
    const px = toPx(t.value)
    if (Number.isFinite(px)) return px < 0 && metered.has(t.category) ? 1e9 - px : px
    const byName = Number(t.name)
    return Number.isFinite(byName) ? byName : Infinity
  }

  const getTokenHtml: StudioRuntime['getTokenHtml'] = (opts = {}) => {
    const items = opts.tokens ?? filter(opts)
    const groups = new Map<string, StudioToken[]>()
    for (const t of items) {
      const group = groups.get(t.category)
      if (group) group.push(t)
      else groups.set(t.category, [t])
    }
    for (const group of groups.values()) group.sort((a, b) => sortKey(a) - sortKey(b))
    return [...groups.entries()]
      .map(
        ([category, group]) =>
          `<section class="pds-group" data-category="${esc(category)}"><h2 class="pds-group__title">${esc(category)}</h2><ul class="pds-tokens">${group.map(renderToken).join('')}</ul></section>`,
      )
      .join('')
  }

  return { getTokenJson, getTokenHtml, getTokenCss }
}

export function studioRuntimeModule(tokens: StudioToken[]): string {
  return `const createStudioRuntime = ${createStudioRuntime.toString()}
const runtime = createStudioRuntime(${JSON.stringify(tokens)})
export const getTokenJson = runtime.getTokenJson
export const getTokenHtml = runtime.getTokenHtml
export const getTokenCss = runtime.getTokenCss
`
}

export function studioArtifactFiles(tokens: StudioToken[]): StudioFile[] {
  const dts = `export interface StudioToken {
  category: string
  path: string
  name: string
  value: string
  conditions?: Record<string, string>
}
export declare function getTokenJson(opts?: { category?: string; query?: string }): StudioToken[]
export declare function getTokenHtml(opts?: { tokens?: StudioToken[]; category?: string; query?: string }): string
export declare function getTokenCss(css?: string): string
`
  return [
    { path: 'studio/index.mjs', code: studioRuntimeModule(tokens) },
    { path: 'studio/index.d.ts', code: dts },
  ]
}
