import { Bool } from 'lil-fp'
import type { JsxSpreadAttribute, Node } from 'ts-morph'
import { P, match } from 'ts-pattern'
import { maybeBoxNode } from './maybe-box-node'
import { maybeObjectLikeBox } from './maybe-object-like-box'
import { box, type BoxNode } from './type-factory'
import type { BoxContext, MatchFnPropArgs, MatchPropArgs } from './types'
import { unwrapExpression } from './utils'

const isBoxNode = (node: BoxNode): node is BoxNode =>
  node.isMap() || node.isObject() || node.isUnresolvable() || node.isConditional()

const isNullish = (node: BoxNode): node is BoxNode =>
  node.isLiteral() && (node.kind == 'null' || node.kind == 'undefined')

type MatchProp = (prop: MatchFnPropArgs | MatchPropArgs) => boolean

export const extractJsxSpreadAttributeValues = (node: JsxSpreadAttribute, ctx: BoxContext, matchProp: MatchProp) => {
  const expr = unwrapExpression(node.getExpression())
  const stack: Node[] = []
  const boxNode = maybeBoxNode(expr, stack, ctx)

  return match(boxNode)
    .with(P.nullish, () => {
      const maybeEntries = maybeObjectLikeBox(expr, stack, ctx, matchProp)
      return maybeEntries ?? box.emptyObject(expr, stack)
    })
    .when(Bool.or(isBoxNode, isNullish), (boxNode) => boxNode)
    .otherwise(() => undefined)
}
