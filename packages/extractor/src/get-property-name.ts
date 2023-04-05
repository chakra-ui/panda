import { Bool } from 'lil-fp'
import type { ObjectLiteralElementLike } from 'ts-morph'
import { Node } from 'ts-morph'
import { match } from 'ts-pattern'
import { box } from './box'
import { maybePropName } from './maybe-box-node'
import type { BoxContext } from './types'
import { unwrapExpression } from './utils'

export const getPropertyName = (property: ObjectLiteralElementLike, stack: Node[], ctx: BoxContext) => {
  return (
    match(property)
      .when(Node.isPropertyAssignment, (property) => {
        const node = unwrapExpression(property.getNameNode())
        return (
          match(node)
            // { propName: "value" }
            .when(Node.isIdentifier, (node) => box.cast(node.getText(), node, stack))

            // { [computed]: "value" }
            .when(Node.isComputedPropertyName, (node) => {
              const expression = node.getExpression()
              stack.push(expression)
              return maybePropName(expression, stack, ctx)
            })

            // { "propName": "value" }
            .when(Bool.or(Node.isStringLiteral, Node.isNumericLiteral), (node) =>
              box.cast(node.getLiteralText(), node, stack),
            )

            .otherwise(() => undefined)
        )
      })

      // { shorthand }
      .when(Node.isShorthandPropertyAssignment, (property) => {
        const name = property.getName()
        if (name != null) return box.cast(name, property, stack)
      })
      .otherwise(() => undefined)
  )
}
