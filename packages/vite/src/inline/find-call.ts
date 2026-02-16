import { type CallExpression, type Node, SyntaxKind } from 'ts-morph'

/**
 * Navigate up from a BoxNode's AST node to find the enclosing CallExpression.
 * The box node typically points at the ObjectLiteral argument; we need the
 * full `css({ ... })` or `hstack({ ... })` call range for replacement.
 */
export function findCallExpression(node: Node): CallExpression | undefined {
  return node.asKind(SyntaxKind.CallExpression) ?? node.getFirstAncestorByKind(SyntaxKind.CallExpression)
}
