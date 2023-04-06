import { createLogScope, logger } from '@pandacss/logger'
import { Identifier, Node } from 'ts-morph'
import { getExportedVarDeclarationWithName, getModuleSpecifierSourceFile } from './maybe-box-node'
import type { BoxContext } from './types'

const scope = createLogScope('findIdentifierValueDeclaration')

export function isScope(node: Node): boolean {
  return (
    Node.isFunctionDeclaration(node) ||
    Node.isFunctionExpression(node) ||
    Node.isArrowFunction(node) ||
    Node.isSourceFile(node)
  )
}

// adapted from https://github.com/dsherret/ts-morph/issues/1351

export function getDeclarationFor(node: Identifier, stack: Node[], ctx: BoxContext) {
  const parent = node.getParent()
  if (!parent) return

  const declarationStack = [] as Node[]

  let declaration

  if (
    (Node.isVariableDeclaration(parent) ||
      Node.isParameterDeclaration(parent) ||
      Node.isFunctionDeclaration(parent) ||
      Node.isBindingElement(parent)) &&
    parent.getNameNode() == node
  ) {
    logger.debug(scope('getDeclarationFor'), { isDeclarationLike: true, kind: parent.getKindName() })
    declarationStack.push(parent)
    declaration = parent
  } else if (Node.isImportSpecifier(parent) && parent.getNameNode() == node) {
    if (ctx.flags?.skipTraverseFiles) return

    const sourceFile = getModuleSpecifierSourceFile(parent.getImportDeclaration())
    logger.debug(scope('getDeclarationFor'), { isImportDeclaration: true, sourceFile: Boolean(sourceFile) })

    if (sourceFile) {
      const exportStack = [parent, sourceFile] as Node[]
      const maybeVar = getExportedVarDeclarationWithName(node.getText(), sourceFile, exportStack, ctx)

      logger.debug(scope('getDeclarationFor'), {
        from: sourceFile.getFilePath(),
        hasVar: Boolean(maybeVar),
      })

      if (maybeVar) {
        declarationStack.push(...exportStack.concat(maybeVar))
        declaration = maybeVar
      }
    }
  }

  logger.debug(scope('getDeclarationFor'), {
    node: node.getKindName(),
    parent: parent.getKindName(),
    declaration: declaration?.getKindName(),
  })

  if (declaration) {
    stack.push(...declarationStack)
  }

  return declaration
}

// TODO getParentWhile ?
const getInnermostScope = (from: Node) => {
  let scope = from.getParent()
  while (scope && !isScope(scope)) {
    // logger.debug("getInnermostScope", scope.getKindName());
    scope = scope.getParent()
  }

  logger.debug('getInnermostScope', { found: scope?.getKindName() })
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
    logger.debug('find', {
      identifier: identifier.getText(),
      scope: scope?.getKindName(),
      count: count++,
    })
    if (!scope) return

    const refName = identifier.getText()
    // eslint-disable-next-line @typescript-eslint/no-loop-func
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

    logger.debug('find', {
      scope: scope.getKindName(),
      foundNode: foundNode?.getKindName(),
      isUnresolvable,
    })
    if (foundNode || isUnresolvable) {
      if (foundNode) {
        stack.push(...innerStack)
      }

      return foundNode
    }
  } while (scope && !Node.isSourceFile(scope) && !foundNode && !isUnresolvable && count < 100)

  logger.debug('find', {
    end: true,
    count,
    scope: scope?.getKindName(),
    isUnresolvable,
  })
}
