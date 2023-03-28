import { createLogger } from './logger'
import type { ObjectLiteralElementLike, ObjectLiteralExpression } from 'ts-morph'
import { Node } from 'ts-morph'

import { evaluateNode, isEvalError } from './evaluate'
import { maybeBoxNode, maybeExpandConditionalExpression, maybePropName } from './maybeBoxNode'
import {
  box,
  type BoxNode,
  BoxNodeConditional,
  BoxNodeLiteral,
  BoxNodeMap,
  BoxNodeObject,
  BoxNodeUnresolvable,
} from './type-factory'
import type { BoxContext, MatchFnPropArgs } from './types'
import { isNotNullish, isObjectLiteral, unwrapExpression } from './utils'

const logger = createLogger('box-ex:extractor:maybe-object')
const cacheMap = new WeakMap<Node, MaybeObjectLikeBoxReturn>()

export type MaybeObjectLikeBoxReturn = BoxNodeObject | BoxNodeMap | BoxNodeUnresolvable | BoxNodeConditional | undefined

export const maybeObjectLikeBox = (
  node: Node,
  stack: Node[],
  ctx: BoxContext,
  matchProp?: (prop: MatchFnPropArgs) => boolean,
): MaybeObjectLikeBoxReturn => {
  const isCached = cacheMap.has(node)
  logger({ kind: node.getKindName(), isCached })
  if (isCached) {
    logger.scoped('cached', { kind: node.getKindName() })
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
        {
          whenTrueExpr,
          whenFalseExpr,
          node,
          stack,
          kind: 'ternary',
          // canReturnWhenTrue: true,
        },
        ctx,
      )
      if (!maybeBox) return
      if (maybeBox.isConditional() || maybeBox.isObject() || maybeBox.isMap()) return cache(maybeBox)

      return cache(box.unresolvable(node, stack))
    }

    if (isNotNullish(maybeObjectLiteral) && isObjectLiteral(maybeObjectLiteral)) {
      return cache(box.object(maybeObjectLiteral, node, stack))
    }

    return cache(box.emptyObject(node, stack))
  }

  const maybeBox = maybeBoxNode(node, stack, ctx)
  if (!maybeBox) return cache(box.unresolvable(node, stack))
  if (maybeBox.isMap() || maybeBox.isObject() || maybeBox.isConditional()) return cache(maybeBox)
}

const getObjectLiteralExpressionPropPairs = (
  expression: ObjectLiteralExpression,
  _stack: Node[],
  ctx: BoxContext,
  matchProp?: (prop: MatchFnPropArgs) => boolean,
) => {
  const properties = expression.getProperties()
  if (properties.length === 0) return box.emptyObject(expression, _stack)

  const extractedPropValues = [] as Array<[string, BoxNode]>
  const spreadConditions = [] as BoxNodeConditional[]
  // console.log({
  //     expression: expression.getText(),
  //     properties: expression.getProperties().map((prop) => prop.getText()),
  // });

  properties.forEach((propElement) => {
    const stack = [..._stack]

    stack.push(propElement)

    if (Node.isPropertyAssignment(propElement) || Node.isShorthandPropertyAssignment(propElement)) {
      const propNameBox = getPropertyName(propElement, stack, ctx)
      if (!propNameBox) return

      const propName = propNameBox.value
      if (!isNotNullish(propName)) return
      if (matchProp && !matchProp?.({ propName: propName as string, propNode: propElement })) {
        return
      }

      const init = propElement.getInitializer()
      if (!init) return

      const initializer = unwrapExpression(init)
      stack.push(initializer)
      logger.scoped('prop', { propName, kind: initializer.getKindName() })

      const maybeValue = maybeBoxNode(initializer, stack, ctx)
      logger.scoped('prop-value', { propName, hasValue: !!maybeValue })

      if (maybeValue) {
        logger.scoped('prop-value', { propName, maybeValue })
        extractedPropValues.push([propName.toString(), maybeValue])
        return
      }

      const maybeObject = maybeObjectLikeBox(initializer, stack, ctx)
      logger.scoped('prop-obj', { propName, hasObject: !!maybeObject })
      // console.log({ maybeObject });
      if (maybeObject) {
        logger.scoped('prop-obj', { propName, maybeObject })
        extractedPropValues.push([propName.toString(), maybeObject])
        return
      }
    }

    if (Node.isSpreadAssignment(propElement)) {
      const initializer = unwrapExpression(propElement.getExpression())
      stack.push(initializer)

      const maybeObject = maybeObjectLikeBox(initializer, stack, ctx, matchProp)
      logger('isSpreadAssignment', { extracted: Boolean(maybeObject) })
      if (!maybeObject) return

      if (maybeObject.isObject()) {
        Object.entries(maybeObject.value).forEach(([propName, value]) => {
          const boxed = box.cast(value, initializer, stack)
          if (!boxed) return

          extractedPropValues.push([propName, boxed])
        })
        return
      }

      if (maybeObject.isMap()) {
        maybeObject.value.forEach((nested, propName) => {
          extractedPropValues.push([propName, nested])
        })
        return
      }

      if (maybeObject.isConditional()) {
        spreadConditions.push(maybeObject)
      }
    }
  })

  // preserves order of insertion, useful for spread operator to override props
  const orderedMapValue = new Map()
  extractedPropValues.forEach(([propName, value]) => {
    if (orderedMapValue.has(propName)) {
      orderedMapValue.delete(propName)
    }

    orderedMapValue.set(propName, value)
  })

  const map = box.map(orderedMapValue, expression, _stack)
  if (spreadConditions.length > 0) {
    map.spreadConditions = spreadConditions
  }

  return map
}

const getPropertyName = (
  property: ObjectLiteralElementLike,
  stack: Node[],
  ctx: BoxContext,
): BoxNodeLiteral | undefined => {
  if (Node.isPropertyAssignment(property)) {
    const node = unwrapExpression(property.getNameNode())

    // { propName: "value" }
    if (Node.isIdentifier(node)) {
      return box.cast(node.getText(), node, stack)
    }

    // { [computed]: "value" }
    if (Node.isComputedPropertyName(node)) {
      const expression = node.getExpression()
      stack.push(expression)

      return maybePropName(expression, stack, ctx)
    }

    // { "propName": "value" }
    if (Node.isStringLiteral(node)) {
      return box.cast(node.getLiteralText(), node, stack)
    }

    // { "propName": "value" }
    if (Node.isNumericLiteral(node)) {
      return box.cast(node.getLiteralText(), node, stack)
    }
  }

  // { shorthand }
  if (Node.isShorthandPropertyAssignment(property)) {
    const name = property.getName()
    if (isNotNullish(name)) return box.cast(name, property, stack)
  }
}
