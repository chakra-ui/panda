import { logger } from '@pandacss/logger'
import { JsxOpeningElement, JsxSelfClosingElement, Node, SourceFile, ts } from 'ts-morph'

import { extractCallExpressionArguments } from './extractCallExpressionArguments'
import { extractJsxAttribute } from './extractJsxAttribute'
import { extractJsxSpreadAttributeValues } from './extractJsxSpreadAttributeValues'
import { box, type BoxNode } from './type-factory'
import type { BoxContext, ComponentMatchers, FunctionMatchers } from './types'

export const extractAtRange = (
  source: SourceFile,
  line: number,
  column: number,
  matchProp: ComponentMatchers['matchProp'] | FunctionMatchers['matchProp'] = () => true,
  ctx: BoxContext = {},
) => {
  const node = getTsNodeAtPosition(source, line, column)
  logger.debug('extractAtRange', { line, column, node: node?.getKindName() })
  if (!node) return

  // pointing directly at the node
  if (Node.isJsxOpeningElement(node) || Node.isJsxSelfClosingElement(node)) {
    return extractJsxElementProps(node, ctx, matchProp as ComponentMatchers['matchProp'])
  }

  if (Node.isCallExpression(node)) {
    // TODO box.function(node) ?
    return extractCallExpressionArguments(node, ctx, (prop) =>
      (matchProp as FunctionMatchers['matchProp'])({
        ...prop,
        fnNode: node,
        fnName: node.getExpression().getText(),
      }),
    )
  }

  // pointing at the name
  const parent = node.getParent()

  if (parent && Node.isIdentifier(node)) {
    logger.debug('extractAtRange', { line, column, parent: parent?.getKindName() })

    if (Node.isJsxOpeningElement(parent) || Node.isJsxSelfClosingElement(parent)) {
      return extractJsxElementProps(parent, ctx, matchProp as ComponentMatchers['matchProp'])
    }

    if (Node.isPropertyAccessExpression(parent)) {
      const grandParent = parent.getParent()
      if (Node.isJsxOpeningElement(grandParent) || Node.isJsxSelfClosingElement(grandParent)) {
        return extractJsxElementProps(grandParent, ctx, matchProp as ComponentMatchers['matchProp'])
      }
    }

    if (Node.isCallExpression(parent)) {
      // TODO box.function(node) ?
      return extractCallExpressionArguments(parent, ctx, (prop) =>
        (matchProp as FunctionMatchers['matchProp'])({
          ...prop,
          fnNode: parent,
          fnName: parent.getExpression().getText(),
        }),
      )
    }
  }
}

export const extractJsxElementProps = (
  node: JsxOpeningElement | JsxSelfClosingElement,
  ctx: BoxContext,
  matchProp: ComponentMatchers['matchProp'],
) => {
  const tagName = node.getTagNameNode().getText()
  const jsxAttributes = node.getAttributes()
  logger.debug('extractAtRange:jsx', { tagName, jsxAttributes: jsxAttributes.length })

  const props = new Map<string, BoxNode>()
  jsxAttributes.forEach((attrNode) => {
    if (Node.isJsxAttribute(attrNode)) {
      const nameNode = attrNode.getNameNode()
      const maybeValue = extractJsxAttribute(attrNode, ctx) ?? box.unresolvable(nameNode, [])
      props.set(nameNode.getText(), maybeValue)
      return
    }

    if (Node.isJsxSpreadAttribute(attrNode)) {
      // increment count since there might be conditional
      // so it doesn't override the whole spread prop
      let count = 0
      const propSizeAtThisPoint = props.size
      const getSpreadPropName = () => `_SPREAD_${propSizeAtThisPoint}_${count++}`

      const spreadPropName = getSpreadPropName()
      const maybeValue =
        extractJsxSpreadAttributeValues(attrNode, ctx, (prop) =>
          matchProp({ ...prop, tagName, tagNode: node } as any),
        ) ?? box.unresolvable(attrNode, [])
      props.set(spreadPropName, maybeValue)
    }
  })

  // TODO box.component(node) ?
  return { type: 'component', node, tagName, props }
}

export const getTsNodeAtPosition = (sourceFile: SourceFile, line: number, column: number) => {
  const pos = ts.getPositionOfLineAndCharacter(
    sourceFile.compilerNode,
    // TS uses 0-based line and char #s
    line - 1,
    column - 1,
  )

  return sourceFile.getDescendantAtPos(pos)
}
