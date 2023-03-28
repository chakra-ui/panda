import { createLogger } from './logger'
import { evaluate } from 'ts-evaluator'
import type { Expression } from 'ts-morph'
import { ts, Node } from 'ts-morph'
import type { BoxContext } from './types'

const TsEvalError = Symbol('EvalError')
const logger = createLogger('box-ex:extractor:evaluator')

const cacheMap = new WeakMap<Expression, unknown>()

/**
 * Evaluates with strict policies restrictions
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
    // TODO only with a flag
    // typeChecker: node.getProject().getTypeChecker().compilerObject as any,
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

  logger({ compilerNodeKind: node.getKindName() })
  if (result.success) {
    logger.scoped('success', result.value)
  } else {
    logger.scoped('error', result.reason.stack)
    logger.lazyScoped('error-reason', () => ({
      result: {
        name: result.reason.name,
        reason: result.reason.message,
        atNode: {
          path: result.reason.node.getSourceFile().fileName + ':' + result.reason.node.getFullStart(),
          start: result.reason.node.getFullStart(),
          end: result.reason.node.getEnd(),
          // text: result.reason.node.getText().slice(0, 100),
          kind: ts.SyntaxKind[result.reason.node.kind],
        },
      },
    }))

    if (logger.isEnabled(logger.namespace + ':trace')) {
      logger.scoped('trace')
      console.trace()
    }
  }

  // TODO BoxNodeUnresolvable kind: "eval-error"
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
