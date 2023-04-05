import { createLogScope, logger } from '@pandacss/logger'
import { Node } from 'ts-morph'
import { box } from './box'
import { BoxNodeConditional, BoxNodeMap, BoxNodeObject, BoxNodeUnresolvable } from './box-factory'
import { evaluateNode, isEvalError } from './evaluate-node'
import { getObjectLiteralExpressionPropPairs } from './get-object-literal-expression-prop-pairs'
import { maybeBoxNode, maybeExpandConditionalExpression } from './maybe-box-node'
import type { BoxContext, MatchFnPropArgs } from './types'
import { isNotNullish, isObjectLiteral, unwrapExpression } from './utils'

const scope = createLogScope('extractor/maybe-object')
const cacheMap = new WeakMap<Node, MaybeObjectLikeBoxReturn>()

export type MaybeObjectLikeBoxReturn = BoxNodeObject | BoxNodeMap | BoxNodeUnresolvable | BoxNodeConditional | undefined

export const maybeObjectLikeBox = (
  node: Node,
  stack: Node[],
  ctx: BoxContext,
  matchProp?: (prop: MatchFnPropArgs) => boolean,
): MaybeObjectLikeBoxReturn => {
  const isCached = cacheMap.has(node)
  logger.debug(scope('node'), { kind: node.getKindName(), isCached })

  if (isCached) {
    logger.debug(scope('node:cached'), { kind: node.getKindName() })
    return cacheMap.get(node)
  }

  const cache = (value: MaybeObjectLikeBoxReturn) => {
    cacheMap.set(node, value)
    return value
  }

  if (Node.isObjectLiteralExpression(node)) {
    return cache(getObjectLiteralExpressionPropPairs(node, stack, ctx, matchProp))
  }

  // <ColorBox {...(xxx ? yyy : zzz)} />
  if (Node.isConditionalExpression(node)) {
    if (ctx.flags?.skipConditions) return cache(box.unresolvable(node, stack))

    const maybeObjectLiteral = evaluateNode(node, stack, ctx)

    // unresolvable condition will return both possible outcome
    if (isEvalError(maybeObjectLiteral)) {
      const whenTrueExpr = unwrapExpression(node.getWhenTrue())
      const whenFalseExpr = unwrapExpression(node.getWhenFalse())

      const maybeBox = maybeExpandConditionalExpression(
        { whenTrueExpr, whenFalseExpr, node, stack, kind: 'ternary' },
        ctx,
      )

      if (!maybeBox) return

      if (box.isConditional(maybeBox) || box.isObject(maybeBox) || box.isMap(maybeBox)) {
        return cache(maybeBox)
      }

      return cache(box.unresolvable(node, stack))
    }

    if (isNotNullish(maybeObjectLiteral) && isObjectLiteral(maybeObjectLiteral)) {
      return cache(box.object(maybeObjectLiteral, node, stack))
    }

    return cache(box.emptyObject(node, stack))
  }

  const maybeBox = maybeBoxNode(node, stack, ctx)
  if (!maybeBox) return cache(box.unresolvable(node, stack))

  if (box.isConditional(maybeBox) || box.isObject(maybeBox) || box.isMap(maybeBox)) {
    return cache(maybeBox)
  }
}
