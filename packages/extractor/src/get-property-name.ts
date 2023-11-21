import type { ObjectLiteralElementLike } from 'ts-morph'
import { Node } from 'ts-morph'
import { box } from './box'
import { maybePropName } from './maybe-box-node'
import type { BoxContext } from './types'
import { unwrapExpression } from './utils'

export const getPropertyName = (property: ObjectLiteralElementLike, stack: Node[], ctx: BoxContext) => {
  if (!property) return

  if (Node.isPropertyAssignment(property)) {
    const node = unwrapExpression(property.getNameNode())

    // { propName: "value" }
    if (Node.isIdentifier(node)) return box.from(node.getText(), node, stack)

    // { [computed]: "value" }
    if (Node.isComputedPropertyName(node)) {
      const expression = node.getExpression()
      stack.push(expression)
      return maybePropName(expression, stack, ctx)
    }

    // { "propName": "value" }
    if (Node.isStringLiteral(node) || Node.isNumericLiteral(node)) return box.from(node.getLiteralText(), node, stack)
  }

  if (Node.isShorthandPropertyAssignment(property)) {
    const name = property.getName()
    if (name != null) return box.from(name, property, stack)
  }
}
