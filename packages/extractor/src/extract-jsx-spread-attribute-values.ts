import type { JsxSpreadAttribute, Node } from 'ts-morph'

import { logger } from '@pandacss/logger'
import { maybeBoxNode } from './maybe-box-node'
import { maybeObjectLikeBox } from './maybe-object-like-box'
import { box } from './type-factory'
import type { BoxContext, MatchFnPropArgs, MatchPropArgs } from './types'
import { unwrapExpression } from './utils'

export const extractJsxSpreadAttributeValues = (
  spreadAttribute: JsxSpreadAttribute,
  ctx: BoxContext,
  matchProp: (prop: MatchFnPropArgs | MatchPropArgs) => boolean,
) => {
  const node = unwrapExpression(spreadAttribute.getExpression())
  logger.debug('extractor:jsx-spread', { node: node.getKindName() })

  const stack = [] as Node[]
  const maybeValue = maybeBoxNode(node, stack, ctx)
  if (maybeValue) {
    if (maybeValue.isMap() || maybeValue.isObject() || maybeValue.isUnresolvable() || maybeValue.isConditional()) {
      return maybeValue
    }

    if (maybeValue.isLiteral() && (maybeValue.kind == 'null' || maybeValue.kind == 'undefined')) {
      return maybeValue
    }
  }

  const maybeEntries = maybeObjectLikeBox(node, stack, ctx, matchProp)
  if (maybeEntries) return maybeEntries

  // TODO unresolvable ?
  return box.emptyObject(node, stack)
}
