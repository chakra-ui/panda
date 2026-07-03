import type { SpecIndex } from './spec-index'

export interface ConfigTokenRefSpan {
  start: number
  end: number
  pathStart: number
  pathEnd: number
  path: string
}

const TOKEN_REF_PATTERN = /\{([a-zA-Z0-9_.]+)\}/g

// Operates on an already-isolated string literal's text (e.g. `'{colors.red.500}'`'s
// content), not a whole source file — callers locate the string literal via the TS/LSP
// AST first, so this never has to distinguish token refs from unrelated `{...}` syntax.
export function findConfigTokenRefs(text: string): ConfigTokenRefSpan[] {
  const refs: ConfigTokenRefSpan[] = []
  for (const match of text.matchAll(TOKEN_REF_PATTERN)) {
    const start = match.index
    const path = match[1]
    const pathStart = start + 1
    refs.push({ start, end: start + match[0].length, pathStart, pathEnd: pathStart + path.length, path })
  }
  return refs
}

export function findConfigTokenRefAt(text: string, position: number): ConfigTokenRefSpan | undefined {
  return findConfigTokenRefs(text).find((ref) => position >= ref.start && position <= ref.end)
}

// Excludes deprecated tokens from the suggestion list — they remain valid references,
// just not something completion should steer authors toward.
export function completeConfigTokenPath(prefix: string, index: SpecIndex): string[] {
  return index.resolveTokenPaths(prefix).filter((path) => index.resolveTokenDeprecation(path) === undefined)
}
