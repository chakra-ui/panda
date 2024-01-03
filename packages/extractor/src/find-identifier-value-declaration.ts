import {
  BindingElement,
  EnumDeclaration,
  FunctionDeclaration,
  Identifier,
  Node,
  ParameterDeclaration,
  VariableDeclaration,
} from 'ts-morph'
import { getExportedVarDeclarationWithName, getModuleSpecifierSourceFile } from './maybe-box-node'
import type { BoxContext } from './types'

export function isScope(node: Node): boolean {
  return (
    Node.isFunctionDeclaration(node) ||
    Node.isFunctionExpression(node) ||
    Node.isArrowFunction(node) ||
    Node.isSourceFile(node)
  )
}

// adapted from https://github.com/dsherret/ts-morph/issues/1351

export function getDeclarationFor(
  node: Identifier,
  stack: Node[],
  ctx: BoxContext,
): VariableDeclaration | ParameterDeclaration | FunctionDeclaration | EnumDeclaration | BindingElement | undefined {
  const parent = node.getParent()
  if (!parent) return

  const declarationStack = [] as Node[]

  let declaration

  if (
    (Node.isVariableDeclaration(parent) ||
      Node.isParameterDeclaration(parent) ||
      Node.isFunctionDeclaration(parent) ||
      Node.isEnumDeclaration(parent) ||
      Node.isBindingElement(parent)) &&
    parent.getNameNode() == node
  ) {
    declarationStack.push(parent)
    declaration = parent
  } else if (Node.isImportSpecifier(parent) && parent.getNameNode() == node) {
    if (ctx.flags?.skipTraverseFiles) return

    const sourceFile = getModuleSpecifierSourceFile(parent.getImportDeclaration())

    if (sourceFile) {
      const exportStack = [parent, sourceFile] as Node[]
      const maybeVar = getExportedVarDeclarationWithName(node.getText(), sourceFile, exportStack, ctx)

      if (maybeVar) {
        declarationStack.push(...exportStack.concat(maybeVar))
        declaration = maybeVar
      }
    }
  }

  if (declaration) {
    stack.push(...declarationStack)
  }

  return declaration
}

const getInnermostScope = (from: Node) => {
  let scope = from.getParent()
  while (scope && !isScope(scope)) {
    scope = scope.getParent()
  }

  return scope
}

export function findIdentifierValueDeclaration(
  identifier: Identifier,
  stack: Node[],
  ctx: BoxContext,
  visitedsWithStack: WeakMap<Node, Node[]> = new Map(),
): ReturnType<typeof getDeclarationFor> | undefined {
  let scope = identifier as Node | undefined
  let foundNode: ReturnType<typeof getDeclarationFor> | undefined
  let isUnresolvable = false
  let count = 0
  const innerStack = [] as Node[]

  do {
    scope = getInnermostScope(scope!)
    count++
    if (!scope) return

    const refName = identifier.getText()

    scope.forEachDescendant((node, traversal) => {
      if (visitedsWithStack.has(node)) {
        traversal.skip()
        innerStack.push(...visitedsWithStack.get(node)!)
        return
      }

      if (node == identifier) return
      visitedsWithStack.set(node, innerStack)

      if (Node.isIdentifier(node) && node.getText() == refName) {
        const declarationStack = [node] as Node[]
        const maybeDeclaration = getDeclarationFor(node, declarationStack, ctx)
        if (maybeDeclaration) {
          if (Node.isParameterDeclaration(maybeDeclaration)) {
            const initializer = maybeDeclaration.getInitializer()
            const typeNode = maybeDeclaration.getTypeNode()
            if (initializer) {
              innerStack.push(...declarationStack.concat(initializer))
              foundNode = maybeDeclaration
            } else if (typeNode && Node.isTypeLiteral(typeNode)) {
              innerStack.push(...declarationStack.concat(typeNode))
              foundNode = maybeDeclaration
            } else {
              isUnresolvable = true
            }

            traversal.stop()
            return
          }

          innerStack.push(...declarationStack)
          foundNode = maybeDeclaration
          traversal.stop()
        }
      }
    })

    if (foundNode || isUnresolvable) {
      if (foundNode) {
        stack.push(...innerStack)
      }

      return foundNode
    }
  } while (scope && !Node.isSourceFile(scope) && !foundNode && !isUnresolvable && count < 100)
}
