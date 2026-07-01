import type { UserConfig } from '@pandacss/types'
import { isPlainObject } from './shared'

export function collectTokenPaths(config: Pick<UserConfig, 'theme'> | undefined): string[] {
  if (!isPlainObject(config?.theme)) return []

  const paths = new Set<string>()
  collect(config.theme.tokens, [], paths)
  collect(config.theme.semanticTokens, [], paths)
  return [...paths].sort()
}

function collect(node: unknown, trail: string[], out: Set<string>): void {
  if (!isPlainObject(node)) return
  if ('value' in node) {
    if (trail.length > 0) out.add(trail.join('.'))
    return
  }
  for (const [key, child] of Object.entries(node)) {
    collect(child, [...trail, key], out)
  }
}
