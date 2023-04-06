import { orElse, pipe } from 'lil-fp'
import type { CallExpression, Node } from 'ts-morph'
import { match } from 'ts-pattern'
import { box } from './box'
import { maybeBoxNode } from './maybe-box-node'
import { maybeObjectLikeBox } from './maybe-object-like-box'
import type { BoxContext, MatchFnArgs, MatchFnArguments, MatchFnPropArgs } from './types'
import { unwrapExpression } from './utils'

const trueFn = () => true
type MatchProp = (prop: MatchFnPropArgs) => boolean
type MatchArg = (prop: MatchFnArgs & MatchFnArguments) => boolean

export const extractCallExpressionArguments = (
  node: CallExpression,
  ctx: BoxContext,
  matchProp: MatchProp = trueFn,
  matchArg: MatchArg = trueFn,
) => {
  const fnArguments = node.getArguments()
  const fnName = node.getExpression().getText()

  if (fnArguments.length === 0) {
    return box.array([], node, [])
  }

  return box.array(
    fnArguments.map((argument, index) => {
      const argNode = unwrapExpression(argument)
      const stack = [node, argNode] as Node[]
      return match(argNode)
        .when(
          (argNode) => matchArg({ fnNode: node, fnName, argNode, index }),
          (argNode) =>
            pipe(
              maybeBoxNode(argNode, stack, ctx),
              orElse(() => maybeObjectLikeBox(argNode, stack, ctx, matchProp)),
              orElse(() => box.unresolvable(argNode, stack)),
            ),
        )
        .otherwise(() => box.unresolvable(argNode, stack))
    }),
    node,
    [],
  )
}
