import { logger } from '@pandacss/logger'
import type { ObjectLiteralExpression } from 'ts-morph'
import { Node } from 'ts-morph'
import { box } from './box'
import { BoxNodeConditional, type BoxNode } from './box-factory'
import { getPropertyName } from './get-property-name'
import { maybeBoxNode } from './maybe-box-node'
import { maybeObjectLikeBox } from './maybe-object-like-box'
import type { BoxContext, MatchFnPropArgs } from './types'
import { isNotNullish, unwrapExpression } from './utils'

export const getObjectLiteralExpressionPropPairs = (
  expression: ObjectLiteralExpression,
  _stack: Node[],
  ctx: BoxContext,
  matchProp?: (prop: MatchFnPropArgs) => boolean,
) => {
  const properties = expression.getProperties()
  if (properties.length === 0) return box.emptyObject(expression, _stack)

  const extractedPropValues = [] as Array<[string, BoxNode]>
  const spreadConditions = [] as BoxNodeConditional[]

  properties.forEach((property) => {
    const stack = [..._stack]

    stack.push(property)

    if (Node.isPropertyAssignment(property) || Node.isShorthandPropertyAssignment(property)) {
      const propNameBox = getPropertyName(property, stack, ctx)
      if (!propNameBox) return

      const propName = propNameBox.value

      if (!isNotNullish(propName)) return

      if (matchProp && !matchProp?.({ propName: propName as string, propNode: property })) {
        return
      }

      const init = property.getInitializer()
      if (!init) return

      const initializer = unwrapExpression(init)
      stack.push(initializer)

      logger.debug('prop', { propName, kind: initializer.getKindName() })

      const maybeValue = maybeBoxNode(initializer, stack, ctx)
      logger.debug('prop-value', { propName, hasValue: !!maybeValue })

      if (maybeValue) {
        logger.debug('prop-value', { propName, maybeValue })
        extractedPropValues.push([propName.toString(), maybeValue])
        return
      }

      const maybeObject = maybeObjectLikeBox(initializer, stack, ctx)
      logger.debug('prop-obj', { propName, hasObject: !!maybeObject })

      if (maybeObject) {
        logger.debug('prop-obj', { propName, maybeObject })
        extractedPropValues.push([propName.toString(), maybeObject])
        return
      }
    }

    if (Node.isSpreadAssignment(property)) {
      const initializer = unwrapExpression(property.getExpression())
      stack.push(initializer)

      const maybeObject = maybeObjectLikeBox(initializer, stack, ctx, matchProp)
      logger.debug('isSpreadAssignment', { extracted: Boolean(maybeObject) })

      if (!maybeObject) return

      if (box.isObject(maybeObject)) {
        Object.entries(maybeObject.value).forEach(([propName, value]) => {
          const boxed = box.cast(value, initializer, stack)
          if (!boxed) return
          extractedPropValues.push([propName, boxed])
        })
        return
      }

      if (box.isMap(maybeObject)) {
        maybeObject.value.forEach((nested, propName) => {
          extractedPropValues.push([propName, nested])
        })
        return
      }

      if (box.isConditional(maybeObject)) {
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
