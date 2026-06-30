export function collectTokenPaths(config: unknown): string[] {
  const theme = (config as { theme?: unknown } | undefined)?.theme
  if (!theme || typeof theme !== 'object') return []

  const paths = new Set<string>()
  for (const layer of [theme as Record<string, unknown>, (theme as Record<string, unknown>).extend]) {
    if (!layer || typeof layer !== 'object') continue
    collect((layer as Record<string, unknown>).tokens, [], paths)
    collect((layer as Record<string, unknown>).semanticTokens, [], paths)
  }
  return [...paths].sort()
}

function collect(node: unknown, trail: string[], out: Set<string>): void {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return
  if ('value' in (node as object)) {
    if (trail.length > 0) out.add(trail.join('.'))
    return
  }
  for (const [key, child] of Object.entries(node as Record<string, unknown>)) {
    collect(child, [...trail, key], out)
  }
}
