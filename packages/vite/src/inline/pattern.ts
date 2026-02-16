import type MagicString from 'magic-string'
import type { PandaContext } from '@pandacss/node'
import type { ResultItem } from '@pandacss/types'
import { SyntaxKind } from 'ts-morph'
import { resolvePatternToClassNames } from './resolver'
import { findCallExpression } from './find-call'

export function inlinePatternCall(ms: MagicString, item: ResultItem, patternName: string, ctx: PandaContext): boolean {
  if (!item.box || !item.data.length) return false

  const callNode = findCallExpression(item.box.getNode())
  if (!callNode) return false

  // Bail on .raw() calls — returns a style object, not a className
  const expr = callNode.getExpression()
  if (expr.getKind() === SyntaxKind.PropertyAccessExpression) return false

  // For jsx-pattern type, resolve to the base pattern name
  const fnName = item.type === 'jsx-pattern' && item.name ? ctx.patterns.find(item.name) : patternName

  const className = resolvePatternToClassNames(ctx, fnName, item.data)
  if (!className) return false

  ms.overwrite(callNode.getStart(), callNode.getEnd(), JSON.stringify(className))
  return true
}
