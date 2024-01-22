import { extractTokens, isColorAttribute, isColorToken, isPandaAttribute, isPandaProp } from '../utils/helpers'
import { type Rule, createRule } from '../utils'
import { isIdentifier, isJSXExpressionContainer, isJSXIdentifier, isLiteral } from '../utils/nodes'

export const RULE_NAME = 'no-hardcoded-color'

const rule: Rule = createRule({
  name: RULE_NAME,
  meta: {
    docs: {
      description: 'Enforce the exclusive use of design tokens as values for colors within the codebase.',
    },
    messages: {
      invalidColor: '`{{color}}` is not a valid color token.',
    },
    type: 'suggestion',
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const isTokenFn = (value?: string) => {
      if (!value) return false
      const tokens = extractTokens(value)
      return tokens.length > 0
    }

    return {
      JSXAttribute(node) {
        if (!isJSXIdentifier(node.name)) return
        if (!isPandaProp(node, context) || !node.value) return

        if (
          isLiteral(node.value) &&
          isColorAttribute(node.name.name, context) &&
          !isTokenFn(node.value.value?.toString()) &&
          !isColorToken(node.value.value?.toString(), context)
        ) {
          context.report({
            node: node.value,
            messageId: 'invalidColor',
            data: {
              color: node.value.value?.toString(),
            },
          })
        }

        if (!isJSXExpressionContainer(node.value)) return

        if (
          isLiteral(node.value.expression) &&
          isColorAttribute(node.name.name, context) &&
          !isTokenFn(node.value.expression.value?.toString()) &&
          !isColorToken(node.value.expression.value?.toString(), context)
        ) {
          context.report({
            node: node.value.expression,
            messageId: 'invalidColor',
            data: {
              color: node.value.expression.value?.toString(),
            },
          })
        }
      },

      Property(node) {
        if (!isIdentifier(node.key)) return
        if (!isLiteral(node.value)) return

        if (!isPandaAttribute(node, context)) return
        if (!isColorAttribute(node.key.name, context)) return
        if (isTokenFn(node.value.value?.toString())) return
        if (isColorToken(node.value.value?.toString(), context)) return

        context.report({
          node: node.value,
          messageId: 'invalidColor',
          data: {
            color: node.value.value?.toString(),
          },
        })
      },
    }
  },
})

export default rule
