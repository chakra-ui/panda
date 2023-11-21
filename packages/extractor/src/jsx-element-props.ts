import { JsxOpeningElement, JsxSelfClosingElement, Node } from 'ts-morph'
import { box } from './box'
import type { BoxNode, BoxNodeMap, BoxNodeObject } from './box-factory'
import { extractJsxAttribute } from './jsx-attribute'
import { extractJsxSpreadAttributeValues } from './jsx-spread-attribute'
import type { BoxContext } from './types'

const isObjectLike = (node: BoxNode | undefined): node is BoxNodeObject | BoxNodeMap =>
  box.isObject(node) || box.isMap(node)

export const extractJsxElementProps = (node: JsxOpeningElement | JsxSelfClosingElement, ctx: BoxContext) => {
  const tagName = node.getTagNameNode().getText()
  const jsxAttributes = node.getAttributes()

  const props = new Map<string, BoxNode>()
  jsxAttributes.forEach((attrNode) => {
    if (Node.isJsxAttribute(attrNode)) {
      const nameNode = attrNode.getNameNode()
      const maybeValue = extractJsxAttribute(attrNode, ctx)
      if (!maybeValue) return

      props.set(nameNode.getText(), maybeValue)
      return
    }

    if (Node.isJsxSpreadAttribute(attrNode)) {
      const maybeValue = extractJsxSpreadAttributeValues(attrNode, ctx, () => true)
      if (!isObjectLike(maybeValue)) return

      if (box.isMap(maybeValue)) {
        maybeValue.value.forEach((value, propName) => {
          props.set(propName, value)
        })
      }

      if (box.isObject(maybeValue)) {
        Object.entries(maybeValue.value).forEach(([propName, value]) => {
          props.set(propName, box.literal(value as any, node, []))
        })
      }
    }
  })

  return { name: tagName, props }
}
