import type { CompletionEntry } from './config-style-object'
import type { SpecIndex } from './spec-index'

export type SemanticTokenCursorKind = 'category' | 'condition'

export interface SemanticTokenContext {
  cursorKind: SemanticTokenCursorKind
  existingKeys: string[]
  prefix: string
}

// Caller must confirm the position is actually inside a defineSemanticTokens(...) call first
// (see typescript-plugin's AST detection) — this has no opinion on where.
export function completeSemanticTokenObject(context: SemanticTokenContext, index: SpecIndex): CompletionEntry[] {
  const used = new Set(context.existingKeys)

  if (context.cursorKind === 'category') {
    return index
      .resolveTokenCategories(context.prefix)
      .filter((name) => !used.has(name))
      .map((name) => ({ name, kind: 'category' }))
  }

  // `base` is the conventional default key alongside real condition names.
  return ['base', ...index.resolveStyleObjectKeys()]
    .filter((name) => !used.has(name) && name.startsWith(context.prefix))
    .map((name) => ({ name, kind: 'condition' }))
}
