import { isPandaAttribute, isPandaProp, resolveLonghand } from '../utils/helpers'
import { type Rule, createRule } from '../utils'
import { isIdentifier } from '../utils/nodes'

export const RULE_NAME = 'no-shorthand-prop'

const rule: Rule = createRule({
  name: RULE_NAME,
  meta: {
    docs: {
      description:
        'Discourage the use of shorthand properties and promote the preference for longhand CSS properties in the codebase.',
    },
    messages: {
      longhand: 'Use longhand property of `{{shorthand}}` instead. Prefer `{{longhand}}`',
    },
    type: 'suggestion',
    fixable: 'code',
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const sendReport = (node: any, name: string) => {
      const longhand = resolveLonghand(name, context)!

      return context.report({
        node,
        messageId: 'longhand' as const,
        data: {
          shorthand: name,
          longhand,
        },
        fix: (fixer) => {
          return fixer.replaceTextRange(node.range, longhand)
        },
      })
    }

    return {
      JSXIdentifier(node) {
        if (!isPandaProp(node, context)) return
        const longhand = resolveLonghand(node.name, context)
        if (!longhand) return

        sendReport(node, node.name)
      },

      Property(node) {
        if (!isIdentifier(node.key)) return
        if (!isPandaAttribute(node, context)) return
        const longhand = resolveLonghand(node.key.name, context)
        if (!longhand) return

        sendReport(node.key, node.key.name)
      },
    }
  },
})

export default rule
