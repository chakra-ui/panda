export function unionType(
  values: IterableIterator<string> | string[] | readonly string[] | Set<string>,
  opts: { fallback?: string; stringify?: (value: string) => string } = {},
) {
  const { fallback, stringify = JSON.stringify } = opts
  const arr = Array.from(values)
  if (fallback != null && !arr.length) return fallback
  return arr.map((v) => stringify(v)).join(' | ')
}
