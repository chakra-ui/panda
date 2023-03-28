import { createLogger } from './logger'
import type { CallExpression, Node } from 'ts-morph'
import { maybeBoxNode } from './maybeBoxNode'

import { maybeObjectLikeBox } from './maybeObjectLikeBox'
import { box } from './type-factory'
import type { BoxContext, MatchFnArgs, MatchFnArguments, MatchFnPropArgs } from './types'
import { unwrapExpression } from './utils'

const logger = createLogger('box-ex:extractor:call-expr')

export const extractCallExpressionArguments = (
  node: CallExpression,
  ctx: BoxContext,
  matchProp: (prop: MatchFnPropArgs) => boolean = () => true,
  matchArg: (prop: MatchFnArgs & MatchFnArguments) => boolean = () => true,
) => {
  const argList = node.getArguments()
  const fnName = node.getExpression().getText()

  if (argList.length === 0) return box.list([], node, [])

  return box.list(
    argList.map((arg, index) => {
      const argNode = unwrapExpression(arg)
      if (!argNode) return box.unresolvable(argNode, [])
      if (!matchArg({ fnNode: node, fnName, argNode, index })) return box.unresolvable(argNode, [])

      const stack = [node, argNode] as Node[]

      const maybeValue = maybeBoxNode(argNode, stack, ctx)
      logger({ extractCallExpression: true, maybeValue })
      if (maybeValue) {
        return maybeValue
      }

      const maybeObject = maybeObjectLikeBox(argNode, stack, ctx, matchProp)
      logger({ maybeObject })
      if (maybeObject) return maybeObject

      return box.unresolvable(argNode, stack)
    }),
    node,
    [],
  )
}
