import { isIdentifier, isVariableDeclaration } from '../utils/nodes'
import { type Rule, createRule } from '../utils'
import { getAncestor, isValidFile } from '../utils/helpers'

export const RULE_NAME = 'no-config-function-in-source'

const rule: Rule = createRule({
  name: RULE_NAME,
  meta: {
    docs: {
      description: 'Prohibit the use of config functions outside the Panda config.',
    },
    messages: {
      configFunction: 'Remove `{{name}}` usage. Config functions should only be used in panda config',
    },
    type: 'suggestion',
    fixable: 'code',
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        if (!isIdentifier(node.callee)) return
        if (!CONFIG_FUNCTIONS.includes(node.callee.name)) return

        if (!isValidFile(context)) return

        context.report({
          node,
          messageId: 'configFunction',
          data: {
            name: node.callee.name,
          },
          fix(fixer) {
            const declaration = getAncestor(isVariableDeclaration, node)
            return fixer.remove(declaration ?? node)
          },
        })
      },
    }
  },
})

export default rule

const CONFIG_FUNCTIONS = [
  'defineConfig',
  'defineRecipe',
  'defineSlotRecipe',
  'defineParts',
  'definePattern',
  'definePreset',
  'defineKeyframes',
  'defineGlobalStyles',
  'defineUtility',
  'defineTextStyles',
  'defineLayerStyles',
  'defineStyles',
  'defineTokens',
  'defineSemanticTokens',
]
