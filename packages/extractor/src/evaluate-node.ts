import { evaluate } from 'ts-evaluator'
import type { Expression } from 'ts-morph'
import { Node, ts } from 'ts-morph'
import type { BoxContext } from './types'

const TsEvalError = Symbol('EvalError')

const cacheMap = new WeakMap<Expression, unknown>()

/**
 * Evaluates a node with strict policies restrictions
 * @see https://github.com/wessberg/ts-evaluator#setting-up-policies
 */
export const evaluateNode = (node: Expression, stack: Node[], ctx: BoxContext) => {
  if (ctx.flags?.skipEvaluate) return
  if (ctx.canEval && !ctx.canEval?.(node, stack)) return

  if (cacheMap.has(node)) {
    return cacheMap.get(node)
  }

  const result = evaluate({
    node: node.compilerNode as any,
    typescript: ts as any,
    policy: {
      deterministic: true,
      network: false,
      console: false,
      maxOps: Number.POSITIVE_INFINITY,
      maxOpDuration: 1000,
      io: { read: true, write: false },
      process: { exit: false, spawnChild: false },
    },
    ...ctx.getEvaluateOptions?.(node, stack),
  })

  const expr = result.success ? result.value : TsEvalError
  cacheMap.set(node, expr)

  return expr
}

export const safeEvaluateNode = <T>(node: Expression, stack: Node[], ctx: BoxContext) => {
  const result = evaluateNode(node, stack, ctx)
  if (result === TsEvalError) return
  return result as T
}

export const isEvalError = (value: unknown): value is typeof TsEvalError => value === TsEvalError
