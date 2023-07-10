import { parse } from '@vue/compiler-sfc'
import MagicString from 'magic-string'
import type { BaseElementNode } from '@vue/compiler-core'

/**
 * @see https://github.com/vuejs/core/blob/d2c3d8b70b2df6e16f053a7ac58e6b04e7b2078f/packages/compiler-core/src/ast.ts#L28-L60
 * import { NodeTypes } from '@vue/compiler-core' isn't working for some reason (?)
 *  Cannot read properties of undefined (reading 'ELEMENT')
 */
const NodeTypes = {
  ROOT: 0,
  ELEMENT: 1,
  TEXT: 2,
  COMMENT: 3,
  SIMPLE_EXPRESSION: 4,
  INTERPOLATION: 5,
  ATTRIBUTE: 6,
  DIRECTIVE: 7,
  COMPOUND_EXPRESSION: 8,
  IF: 9,
  IF_BRANCH: 10,
  FOR: 11,
  TEXT_CALL: 12,
  VNODE_CALL: 13,
  JS_CALL_EXPRESSION: 14,
  JS_OBJECT_EXPRESSION: 15,
  JS_PROPERTY: 16,
  JS_ARRAY_EXPRESSION: 17,
  JS_FUNCTION_EXPRESSION: 18,
  JS_CONDITIONAL_EXPRESSION: 19,
  JS_CACHE_EXPRESSION: 20,
  JS_BLOCK_STATEMENT: 21,
  JS_TEMPLATE_LITERAL: 22,
  JS_IF_STATEMENT: 23,
  JS_ASSIGNMENT_EXPRESSION: 24,
  JS_SEQUENCE_EXPRESSION: 25,
  JS_RETURN_STATEMENT: 26,
} as const

export const vueToTsx = (code: string) => {
  try {
    const parsed = parse(code)
    const fileStr = new MagicString(code)

    const rewriteProp = (prop: BaseElementNode['props'][number]) => {
      if (
        prop.type === NodeTypes.DIRECTIVE &&
        prop.exp?.type === NodeTypes.SIMPLE_EXPRESSION &&
        prop.arg?.type === NodeTypes.SIMPLE_EXPRESSION
      ) {
        fileStr.update(prop.loc.start.offset, prop.loc.end.offset, `${prop.arg.content}={${prop.exp.content}}`)
      }
    }

    const stack = [...parsed.descriptor.template!.ast.children]
    // recursion-free traversal
    while (stack.length) {
      const node = stack.pop()
      if (!node) continue

      if (node.type === NodeTypes.ELEMENT) {
        node.props.forEach(rewriteProp)
        node.children.forEach((child) => stack.push(child))
      }
    }

    const templateStart = code.indexOf('<template')
    const templateEnd = code.indexOf('</template>') + '</template>'.length
    const scriptContent = (parsed.descriptor.scriptSetup ?? parsed.descriptor.script)?.content + '\n'

    const transformed = new MagicString(
      `${scriptContent}\nconst render = ${fileStr.snip(templateStart, templateEnd).toString()}`,
    )

    return transformed.toString()
  } catch (err) {
    return ''
  }
}
