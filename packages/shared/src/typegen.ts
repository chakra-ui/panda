export function unionType(
  values: IterableIterator<string> | string[] | readonly string[] | Set<string>,
  opts: { fallback?: string; stringify?: (value: string) => string } = {},
) {
  const { fallback, stringify = JSON.stringify } = opts
  const arr = Array.from(values)
  if (fallback != null && !arr.length) return fallback
  return arr.map((v) => stringify(v)).join(' | ')
}

export function documentedUnionType<TokenMeta extends { description?: string }>(
  tokenMap: Map<string, TokenMeta>,
  opts: { fallback?: string; stringify?: (value: string) => string } = {},
) {
  const { stringify = JSON.stringify } = opts

  const entries = Array.from(tokenMap.entries())
  if (!entries.length) return opts.fallback ?? 'never'

  const hasAnyDescription = entries.some(([, token]) => token.description)

  if (!hasAnyDescription) {
    return unionType(
      entries.map(([key]) => key),
      opts,
    )
  }

  const members = entries.map(([key, token]) => {
    const quoted = stringify(key)

    if (token.description) {
      return `  | /** ${token.description} */ ${quoted}`
    }
    return `  | ${quoted}`
  })

  return '\n' + members.join('\n')
}
