import type MagicString from 'magic-string'
import type { PandaContext } from '@pandacss/node'
import type { ResultItem } from '@pandacss/types'
import { resolveStylesToClassNames } from './resolver'
import { findCallExpression } from './find-call'

export function inlineCssCall(ms: MagicString, item: ResultItem, ctx: PandaContext): boolean {
  if (!item.box || !item.data.length) return false

  const className = resolveStylesToClassNames(ctx, item.data)
  if (!className) return false

  const callNode = findCallExpression(item.box.getNode())
  if (!callNode) return false

  const start = callNode.getStart()
  const end = callNode.getEnd()

  ms.overwrite(start, end, JSON.stringify(className))
  return true
}
