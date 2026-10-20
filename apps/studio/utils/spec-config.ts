import type { DesignSystemSpec } from '~/utils/design-system'

type TokenTree = Record<string, unknown>

function setPath(tree: TokenTree, segments: string[], leaf: unknown) {
  let node = tree
  for (const segment of segments.slice(0, -1)) {
    const next = node[segment]
    if (!next || typeof next !== 'object' || 'value' in (next as object)) {
      const child: TokenTree = next && typeof next === 'object' ? { DEFAULT: next } : {}
      node[segment] = child
    }
    node = node[segment] as TokenTree
  }
  const last = segments.at(-1)!
  const existing = node[last]
  if (existing && typeof existing === 'object' && !('value' in (existing as object))) {
    ;(existing as TokenTree).DEFAULT = leaf
  } else {
    node[last] = leaf
  }
}

/**
 * Rebuilds the token side of a Panda config from a spec, so the compiler can inspect code against a system
 * when only its `design-system.json` is available. Values are already resolved; utilities come from the base preset.
 */
export function specToConfig(spec: DesignSystemSpec) {
  const tokens: TokenTree = {}
  const semanticTokens: TokenTree = {}
  const breakpoints: Record<string, string> = {}
  const themes: Record<string, { semanticTokens: TokenTree }> = {}

  const rows = new Map<string, typeof spec.values>()
  for (const row of spec.values) rows.set(row.token, [...(rows.get(row.token) ?? []), row])

  for (const path of spec.paths) {
    const token = spec.tokens[path]
    const values = rows.get(path) ?? []
    const base = values.find((row) => !row.condition && !row.theme)
    if (!token || !base) continue
    const [category, ...rest] = path.split('.')
    if (!rest.length) continue

    if (category === 'breakpoints') breakpoints[rest.join('.')] = base.value

    const conditional = values.filter((row) => row.condition && !row.theme)
    const isSemantic = token.semantic || conditional.length > 0
    if (isSemantic) {
      const value = conditional.length
        ? Object.fromEntries([['base', base.value], ...conditional.map((row) => [row.condition!, row.value])])
        : base.value
      setPath(semanticTokens, [category, ...rest], { value })
    } else {
      setPath(tokens, [category, ...rest], { value: base.value })
    }

    for (const row of values.filter((r) => r.theme && !r.condition)) {
      const theme = (themes[row.theme!] ??= { semanticTokens: {} })
      setPath(theme.semanticTokens, [category, ...rest], { value: row.value })
    }
  }

  const conditions = Object.fromEntries(
    Object.entries(spec.conditions)
      .filter(([, query]) => typeof query === 'string')
      .map(([name, query]) => [name.replace(/^_/, ''), query]),
  )

  return {
    conditions,
    theme: { breakpoints, tokens, semanticTokens },
    themes,
  }
}
