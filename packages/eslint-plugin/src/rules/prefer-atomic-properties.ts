import { isPandaAttribute, isPandaProp, isValidProperty, resolveShorthand } from '../utils/helpers'
import { type Rule, createRule } from '../utils'
import { shorthandProperties } from '../utils/shorthand-properties'
import { isIdentifier } from '../utils/nodes'

export const RULE_NAME = 'prefer-atomic-properties'

const rule: Rule = createRule({
  name: RULE_NAME,
  meta: {
    docs: {
      description: 'Encourage the use of atomic properties instead of composite shorthand properties in the codebase.',
    },
    messages: {
      atomic: 'Use atomic properties of `{{composite}}` instead. Prefer: \n{{atomics}}',
    },
    type: 'suggestion',
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const resolveCompositeProperty = (name: string) => {
      if (Object.hasOwn(shorthandProperties, name)) return name

      const longhand = resolveShorthand(name, context)
      if (isValidProperty(longhand, context) && Object.hasOwn(shorthandProperties, longhand)) return longhand
    }

    const sendReport = (node: any, name: string) => {
      const cpd = resolveCompositeProperty(name)!

      const atomics = shorthandProperties[cpd].map((name) => `\`${name}\``).join(',\n')

      return context.report({
        node,
        messageId: 'atomic',
        data: {
          composite: name,
          atomics,
        },
      })
    }

    return {
      JSXIdentifier(node) {
        if (!isPandaProp(node, context)) return
        const cpd = resolveCompositeProperty(node.name)
        if (!cpd) return

        sendReport(node, node.name)
      },

      Property(node) {
        if (!isIdentifier(node.key)) return
        if (!isPandaAttribute(node, context)) return
        const cpd = resolveCompositeProperty(node.key.name)
        if (!cpd) return

        sendReport(node.key, node.key.name)
      },
    }
  },
})

export default rule
