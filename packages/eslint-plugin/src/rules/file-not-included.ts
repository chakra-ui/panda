import { type Rule, createRule } from '../utils'
import { isPandaImport, isValidFile } from '../utils/helpers'

export const RULE_NAME = 'file-not-included'

const rule: Rule = createRule({
  name: RULE_NAME,
  meta: {
    docs: {
      description:
        'Disallow the use of panda css in files that are not included in the specified panda `include` config.',
    },
    messages: {
      include: 'The use of Panda CSS is not allowed in this file. Please check the specified `include` config.',
    },
    type: 'suggestion',
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      ImportDeclaration(node) {
        if (!isPandaImport(node, context)) return
        if (isValidFile(context)) return

        context.report({
          node,
          messageId: 'include',
        })
      },
    }
  },
})

export default rule
