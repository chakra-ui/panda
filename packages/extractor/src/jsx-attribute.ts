import type { JsxAttribute } from 'ts-morph'
import { Node } from 'ts-morph'
import { P, match } from 'ts-pattern'
import { box } from './box'
import { maybeBoxNode } from './maybe-box-node'
import type { BoxContext } from './types'
import { trimWhitespace, unwrapExpression } from './utils'

// <ColorBox color="red.200" backgroundColor="blackAlpha.100" />
//           ^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// identifier = `color` (and then backgroundColor)
// parent = `color="red.200"` (and then backgroundColor="blackAlpha.100")

export const extractJsxAttribute = (jsxAttribute: JsxAttribute, ctx: BoxContext) => {
  const initializer = jsxAttribute.getInitializer()
  const stack = [jsxAttribute, initializer] as Node[]
  return (
    match(initializer)
      .with(P.nullish, () => {
        const nameNode = jsxAttribute.getNameNode()
        return box.emptyInitializer(nameNode, stack)
      })

      // <ColorBox color="red.200" />
      .when(Node.isStringLiteral, (initializer) => {
        const literalText = initializer.getLiteralText()
        return box.literal(trimWhitespace(literalText), initializer, stack)
      })

      // <ColorBox color={xxx} />
      .when(Node.isJsxExpression, (initializer) => {
        const expr = initializer.getExpression()
        if (!expr) return

        const expression = unwrapExpression(expr)
        if (!expression) return

        stack.push(expression)

        const maybeValue = maybeBoxNode(expression, stack, ctx)
        if (maybeValue) return maybeValue
      })

      .otherwise(() => undefined)
  )
}
