import { isPandaAttribute, isPandaProp } from '../utils/helpers'
import { type Rule, createRule } from '../utils'
import { getArbitraryValue } from '@pandacss/shared'
import { isIdentifier, isJSXExpressionContainer, isLiteral, isTemplateLiteral, type Node } from '../utils/nodes'

export const RULE_NAME = 'no-escape-hatch'

const rule: Rule = createRule({
  name: RULE_NAME,
  meta: {
    docs: {
      description: 'Prohibit the use of escape hatch syntax in the code.',
    },
    messages: {
      escapeHatch:
        'Avoid using the escape hatch [value] for undefined tokens. Define a corresponding token in your design system for better consistency and maintainability.',
    },
    type: 'suggestion',
    fixable: 'code',
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const removeQuotes = ([start, end]: readonly [number, number]) => [start + 1, end - 1] as const

    const hasEscapeHatch = (value?: string) => {
      if (!value) return false
      return getArbitraryValue(value) !== value.trim()
    }

    const handleLiteral = (node: Node) => {
      if (!isLiteral(node)) return
      if (!hasEscapeHatch(node.value?.toString())) return

      sendReport(node)
    }

    const handleTemplateLiteral = (node: Node) => {
      if (!isTemplateLiteral(node)) return
      if (node.expressions.length > 0) return
      if (!hasEscapeHatch(node.quasis[0].value.raw)) return

      sendReport(node.quasis[0], node.quasis[0].value.raw)
    }

    const sendReport = (node: any, _value?: string) => {
      const value = _value ?? node.value?.toString()

      return context.report({
        node,
        messageId: 'escapeHatch',
        fix: (fixer) => {
          return fixer.replaceTextRange(removeQuotes(node.range), getArbitraryValue(value))
        },
      })
    }

    return {
      JSXAttribute(node) {
        if (!node.value) return
        if (!isPandaProp(node, context)) return

        handleLiteral(node.value)

        if (!isJSXExpressionContainer(node.value)) return

        handleLiteral(node.value.expression)
        handleTemplateLiteral(node.value.expression)
      },

      Property(node) {
        if (!isIdentifier(node.key)) return
        if (!isLiteral(node.value) && !isTemplateLiteral(node.value)) return
        if (!isPandaAttribute(node, context)) return

        handleLiteral(node.value)
        handleTemplateLiteral(node.value)
      },
    }
  },
})

export default rule
