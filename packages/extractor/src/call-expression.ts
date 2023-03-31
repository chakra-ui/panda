import type { CallExpression, Node } from 'ts-morph'
import { maybeBoxNode } from './maybe-box-node'
import { maybeObjectLikeBox } from './maybe-object-like-box'
import { box } from './type-factory'
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
    return box.list([], node, [])
  }

  return box.list(
    fnArguments.map((argument, index) => {
      const argNode = unwrapExpression(argument)

      if (!argNode) {
        return box.unresolvable(argNode, [])
      }

      if (!matchArg({ fnNode: node, fnName, argNode, index })) {
        return box.unresolvable(argNode, [])
      }

      const stack = [node, argNode] as Node[]

      const maybeValue = maybeBoxNode(argNode, stack, ctx)
      if (maybeValue) {
        return maybeValue
      }

      const maybeObject = maybeObjectLikeBox(argNode, stack, ctx, matchProp)
      if (maybeObject) {
        return maybeObject
      }

      return box.unresolvable(argNode, stack)
    }),
    node,
    [],
  )
}
