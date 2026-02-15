/**
 * Navigate up from a BoxNode's AST node to find the enclosing CallExpression.
 * The box node typically points at the ObjectLiteral argument; we need the
 * full `css({ ... })` or `hstack({ ... })` call range for replacement.
 *
 * Uses getKindName() instead of importing ts-morph directly to avoid bundling it.
 */
export function findCallExpression(node: {
  getKindName(): string
  getStart(): number
  getEnd(): number
  getParent(): any
}): { getStart(): number; getEnd(): number } | null {
  let current = node
  while (current) {
    if (current.getKindName() === 'CallExpression') return current
    current = current.getParent?.()
  }
  return null
}
