import type MagicString from 'magic-string'
import type { PandaContext } from '@pandacss/node'
import type { ResultItem } from '@pandacss/types'
import { SyntaxKind } from 'ts-morph'
import { resolveStylesToClassNames } from './resolver'
import { findCallExpression } from './find-call'

export function inlineCssCall(ms: MagicString, item: ResultItem, ctx: PandaContext): boolean {
  if (!item.box || !item.data.length) return false

  const callNode = findCallExpression(item.box.getNode())
  if (!callNode) return false

  // Bail on css.raw() — returns a style object, not a className
  const expr = callNode.getExpression()
  if (expr.getKind() === SyntaxKind.PropertyAccessExpression) return false

  // Bail if any argument is not a static object literal
  const args = callNode.getArguments()
  if (args.some((arg) => arg.getKind() !== SyntaxKind.ObjectLiteralExpression)) return false

  const className = resolveStylesToClassNames(ctx, item.data)
  if (!className) return false

  ms.overwrite(callNode.getStart(), callNode.getEnd(), JSON.stringify(className))
  return true
}
