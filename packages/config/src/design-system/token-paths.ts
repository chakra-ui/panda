import type { UserConfig } from '@pandacss/types'
import { isDeepStrictEqual } from 'node:util'
import { isPlainObject } from '../shared'

export function collectTokenPaths(config: Pick<UserConfig, 'theme'> | undefined): string[] {
  return [...collectTokenEntries(config).keys()].sort()
}

export type TokenEntries = Map<string, unknown[]>

export function collectTokenEntries(config: Pick<UserConfig, 'theme'> | undefined): TokenEntries {
  const entries: TokenEntries = new Map()

  if (!isPlainObject(config?.theme)) {
    return entries
  }

  collect(config.theme.tokens, [], entries)
  collect(config.theme.semanticTokens, [], entries)

  return entries
}

export function resolveUserTokenPathsAfterHooks(
  userTokenPaths: string[],
  beforeHooks: TokenEntries,
  afterHooks: Pick<UserConfig, 'theme'>,
): string[] {
  const paths = new Set(userTokenPaths)
  const after = collectTokenEntries(afterHooks)

  for (const path of paths) {
    if (!after.has(path)) {
      paths.delete(path)
    }
  }

  for (const [path, values] of after) {
    if (!beforeHooks.has(path) || !isDeepStrictEqual(beforeHooks.get(path), values)) {
      paths.add(path)
    }
  }

  return [...paths].sort()
}

function collect(node: unknown, trail: string[], out: TokenEntries): void {
  if (!isPlainObject(node)) {
    return
  }

  if ('value' in node) {
    if (trail.length > 0) {
      const path = trail.join('.')
      const entries = out.get(path) ?? []

      entries.push(node.value)
      out.set(path, entries)
    }

    return
  }

  for (const [key, child] of Object.entries(node)) {
    collect(child, [...trail, key], out)
  }
}
