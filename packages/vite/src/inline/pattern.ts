import type MagicString from 'magic-string'
import type { PandaContext } from '@pandacss/node'
import type { ResultItem } from '@pandacss/types'
import { SyntaxKind } from 'ts-morph'
import { resolvePatternToClassNames } from './resolver'
import { findCallExpression } from './find-call'
import { boxHasConditionals, analyzeConditional, buildNestedTernary } from './resolve-conditional'

export function inlinePatternCall(ms: MagicString, item: ResultItem, patternName: string, ctx: PandaContext): boolean {
  if (!item.box || !item.data.length) return false

  const callNode = findCallExpression(item.box.getNode())
  if (!callNode) return false

  // Bail on .raw() calls — returns a style object, not a className
  const expr = callNode.getExpression()
  if (expr.getKind() === SyntaxKind.PropertyAccessExpression) return false

  // For jsx-pattern type, resolve to the base pattern name
  const fnName = item.type === 'jsx-pattern' && item.name ? ctx.patterns.find(item.name) : patternName

  // Check for conditional values (ternary, &&)
  if (boxHasConditionals(item.box)) {
    const args = callNode.getArguments()
    if (args.length !== 1 || item.box.type !== 'map') return false

    const cond = analyzeConditional(item.box)
    if (!cond) return false

    const replacement = buildNestedTernary(cond.conditions, cond.branches, (data) =>
      resolvePatternToClassNames(ctx, fnName, data),
    )
    ms.overwrite(callNode.getStart(), callNode.getEnd(), replacement)
    return true
  }

  const className = resolvePatternToClassNames(ctx, fnName, item.data)
  if (!className) return false

  ms.overwrite(callNode.getStart(), callNode.getEnd(), JSON.stringify(className))
  return true
}
