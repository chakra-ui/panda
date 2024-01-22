import { type Rule, createRule } from '../utils'
import { isPandaAttribute, isPandaProp } from '../utils/helpers'
import { isIdentifier, isJSXExpressionContainer, isLiteral, isTemplateLiteral } from '../utils/nodes'

export const RULE_NAME = 'no-dynamic-styling'

const rule: Rule = createRule({
  name: RULE_NAME,
  meta: {
    docs: {
      description:
        "Ensure user doesn't use dynamic styling at any point. Prefer to use static styles, leverage css variables or recipes for known dynamic styles.",
    },
    messages: {
      dynamic: 'Remove dynamic value. Prefer static styles',
    },
    type: 'suggestion',
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      JSXAttribute(node) {
        if (!node.value) return
        if (isLiteral(node.value)) return
        if (isJSXExpressionContainer(node.value) && isLiteral(node.value.expression)) return

        // For syntax like: <Circle property={`value that could be multiline`} />
        if (
          isJSXExpressionContainer(node.value) &&
          isTemplateLiteral(node.value.expression) &&
          node.value.expression.expressions.length === 0
        )
          return

        if (!isPandaProp(node.name, context)) return

        context.report({
          node: node.value,
          messageId: 'dynamic',
        })
      },

      Property(node) {
        if (!isIdentifier(node.key)) return
        if (isLiteral(node.value)) return

        // For syntax like: { property: `value that could be multiline` }
        if (isTemplateLiteral(node.value) && node.value.expressions.length === 0) return

        if (!isPandaAttribute(node, context)) return

        context.report({
          node: node.value,
          messageId: 'dynamic',
        })
      },
    }
  },
})

export default rule
