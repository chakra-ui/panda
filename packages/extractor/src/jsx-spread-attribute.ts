import type { JsxSpreadAttribute, Node } from 'ts-morph'
import { maybeBoxNode } from './maybe-box-node'
import type { BoxContext, MatchFnPropArgs, MatchPropArgs } from './types'
import { unwrapExpression } from './utils'

type MatchProp = (prop: MatchFnPropArgs | MatchPropArgs) => boolean

export const extractJsxSpreadAttributeValues = (node: JsxSpreadAttribute, ctx: BoxContext, matchProp: MatchProp) => {
  const expr = unwrapExpression(node.getExpression())
  const stack: Node[] = []
  return maybeBoxNode(expr, stack, ctx, matchProp)
}
