import type { CssPropertyDefinition, CssPropertySyntax, LiteralUnion } from '@pandacss/types'

/** Omit `initialValue` when the variable is read through a fallback (`var(--blur, )`). */
export function cssVar(syntax: LiteralUnion<CssPropertySyntax>, initialValue?: string): CssPropertyDefinition {
  return initialValue === undefined ? { syntax, inherits: false } : { syntax, inherits: false, initialValue }
}

export function anyVar(initialValue?: string): CssPropertyDefinition {
  return cssVar('*', initialValue)
}
