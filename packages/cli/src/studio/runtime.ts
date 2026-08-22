import type { StudioRuntime, StudioToken } from './types'

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
    const deprecated = t.deprecated
      ? ` data-deprecated="${esc(typeof t.deprecated === 'string' ? t.deprecated : '')}"`
      : ''
    const attrs = `data-category="${esc(t.category)}" data-name="${esc(t.name)}" data-value="${esc(t.value)}"${deprecated}`
    if (t.conditions) {
      const conds = Object.entries(t.conditions)
        .map(
          ([cond, value]) =>
            `<div class="pds-condition" data-condition="${esc(cond)}" data-value="${esc(value)}"><span class="pds-condition__name">${esc(cond)}</span> <code class="pds-condition__value">${esc(value)}</code></div>`,
        )
        .join('')
      return `<li class="pds-token pds-token--semantic" ${attrs}><span class="pds-token__name">${esc(t.name)}</span><div class="pds-conditions">${conds}</div></li>`
    }
    return `<li class="pds-token" ${attrs}><span class="pds-token__name">${esc(t.name)}</span> <code class="pds-token__value">${esc(t.value)}</code></li>`
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
  const nameCompare = (a: StudioToken, b: StudioToken) => a.name.localeCompare(b.name, undefined, { numeric: true })
  const sortTokens = (list: StudioToken[], sort: 'value' | 'name' = 'value') => {
    const order = new Map<string, number>()
    for (const t of list) if (!order.has(t.category)) order.set(t.category, order.size)
    const within = sort === 'name' ? nameCompare : (a: StudioToken, b: StudioToken) => sortKey(a) - sortKey(b)
    return [...list].sort((a, b) => (order.get(a.category) ?? 0) - (order.get(b.category) ?? 0) || within(a, b))
  }

  const getTokenJson: StudioRuntime['getTokenJson'] = (opts = {}) => sortTokens(filter(opts), opts.sort)

  const getTokenHtml: StudioRuntime['getTokenHtml'] = (opts = {}) => {
    const items = sortTokens(opts.tokens ?? filter(opts), opts.sort)
    const groups = new Map<string, StudioToken[]>()
    for (const t of items) {
      const group = groups.get(t.category)
      if (group) group.push(t)
      else groups.set(t.category, [t])
    }
    return [...groups.entries()]
      .map(
        ([category, group]) =>
          `<section class="pds-group" data-category="${esc(category)}"><h2 class="pds-group__title">${esc(category)}</h2><ul class="pds-tokens">${group.map(renderToken).join('')}</ul></section>`,
      )
      .join('')
  }

  return { getTokenJson, getTokenHtml, getTokenCss }
}
