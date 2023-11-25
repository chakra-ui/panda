import type { CallExpression, Node } from 'ts-morph'
import { box } from './box'
import { maybeBoxNode } from './maybe-box-node'
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

      if (matchArg({ fnNode: node, fnName, argNode, index })) {
        return maybeBoxNode(argNode, stack, ctx, matchProp) ?? box.unresolvable(argNode, stack)
      }

      return box.unresolvable(argNode, stack)
    }),
    node,
    [],
  )
}
