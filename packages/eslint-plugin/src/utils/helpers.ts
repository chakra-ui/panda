import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { ImportResult } from '@pandacss/core'
import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { syncAction } from './'
import {
  isCallExpression,
  isIdentifier,
  isImportDeclaration,
  isImportSpecifier,
  isJSXAttribute,
  isJSXExpressionContainer,
  isJSXIdentifier,
  isJSXMemberExpression,
  isJSXOpeningElement,
  isMemberExpression,
  isVariableDeclaration,
  type Node,
} from './nodes'

export const getAncestor = <A extends AST_NODE_TYPES, N = Extract<Node, { type: A }>>(
  ofType: (node: N) => node is N,
  for_: Node,
): N | undefined => {
  let current: Node | undefined = for_.parent
  while (current) {
    if (ofType(current as N)) return current as N
    current = current.parent
  }

  return
}

const getSyncOpts = (context: RuleContext<any, any>) => {
  return {
    currentFile: context.getFilename(),
    configPath: context.settings['@pandacss/configPath'] as string | undefined,
  }
}

const _getImports = (context: RuleContext<any, any>) => {
  const imports: ImportResult[] = []

  context.getSourceCode().ast.body.forEach((node) => {
    if (!isImportDeclaration(node)) return

    const mod = node.source.value
    if (!mod) return

    node.specifiers.forEach((specifier) => {
      if (!isImportSpecifier(specifier)) return

      const name = specifier.imported.name
      const alias = specifier.local.name

      const result = { name, alias, mod }

      imports.push(result)
    })
  })

  return imports
}

const getImports = (context: RuleContext<any, any>) => {
  const imports = _getImports(context)

  return imports.filter((imp) => syncAction('matchImports', getSyncOpts(context), imp))
}

const isValidStyledProp = <T extends Node | string>(node: T, context: RuleContext<any, any>) => {
  if (typeof node === 'string') return
  return isJSXIdentifier(node) && isValidProperty(node.name, context)
}

const isPandaIsh = (name: string, context: RuleContext<any, any>) => {
  const imports = getImports(context)
  return syncAction('matchFile', getSyncOpts(context), name, imports)
}

const findDeclaration = (name: string, context: RuleContext<any, any>) => {
  let decl: TSESTree.VariableDeclarator | undefined
  context.getSourceCode().ast.body.forEach((node) => {
    if (!isVariableDeclaration(node)) return
    decl = node.declarations.find((decl) => isIdentifier(decl.id) && decl.id.name === name)
  })
  return decl
}

const isLocalStyledFactory = (node: TSESTree.JSXOpeningElement, context: RuleContext<any, any>) => {
  if (!isJSXIdentifier(node.name)) return
  const decl = findDeclaration(node.name.name, context)

  if (!decl) return
  if (!isCallExpression(decl.init)) return
  if (!isIdentifier(decl.init.callee)) return
  if (!isPandaIsh(decl.init.callee.name, context)) return

  return true
}

export const isValidFile = (context: RuleContext<any, any>) => {
  return syncAction('isValidFile', getSyncOpts(context))
}

export const isValidProperty = (name: string, context: RuleContext<any, any>) => {
  return syncAction('isValidProperty', getSyncOpts(context), name)
}

export const isPandaImport = (node: TSESTree.ImportDeclaration, context: RuleContext<any, any>) => {
  const imports = getImports(context)
  return imports.some((imp) => imp.mod === node.source.value)
}

export const isPandaProp = <T extends Node>(node: T, context: RuleContext<any, any>) => {
  const jsxAncestor = getAncestor(isJSXOpeningElement, node)

  if (!jsxAncestor) return

  if (
    isJSXMemberExpression(jsxAncestor.name) &&
    isJSXIdentifier(jsxAncestor.name.object) &&
    isPandaIsh(jsxAncestor.name.object.name, context)
  )
    return true
  else if (!isJSXIdentifier(jsxAncestor.name)) return

  // Ensure component is a panda component
  if (!isPandaIsh(jsxAncestor.name.name, context) && !isLocalStyledFactory(jsxAncestor, context)) return
  return true
}

export const isPandaAttribute = <T extends Node>(node: T, context: RuleContext<any, any>) => {
  const callAncestor = getAncestor(isCallExpression, node)

  // Object could be in JSX prop value i.e css prop or a pseudo
  if (!callAncestor) {
    const jsxExprAncestor = getAncestor(isJSXExpressionContainer, node)
    const jsxAttrAncestor = getAncestor(isJSXAttribute, node)

    if (!jsxExprAncestor || !jsxAttrAncestor) return
    if (!isPandaProp(jsxAttrAncestor.name, context)) return
    if (!isValidStyledProp(jsxAttrAncestor.name, context)) return

    return true
  }

  // E.g. css({...})
  if (isIdentifier(callAncestor.callee)) {
    return isPandaIsh(callAncestor.callee.name, context)
  }

  // css.raw({...})
  if (isMemberExpression(callAncestor.callee) && isIdentifier(callAncestor.callee.object)) {
    return isPandaIsh(callAncestor.callee.object.name, context)
  }

  return
}

export const resolveLonghand = (name: string, context: RuleContext<any, any>) => {
  return syncAction('resolveLongHand', getSyncOpts(context), name)
}

export const resolveShorthand = (name: string, context: RuleContext<any, any>) => {
  return syncAction('resolveShorthand', getSyncOpts(context), name)
}

export const isColorAttribute = (attr: string, context: RuleContext<any, any>) => {
  return syncAction('isColorAttribute', getSyncOpts(context), attr)
}

export const isColorToken = (value: string | undefined, context: RuleContext<any, any>) => {
  if (!value) return
  return syncAction('isColorToken', getSyncOpts(context), value)
}

export const extractTokens = (value: string) => {
  const regex = /token\(([^"'(),]+)(?:,\s*([^"'(),]+))?\)|\{([^{}]+)\}/g
  const matches = []
  let match

  while ((match = regex.exec(value)) !== null) {
    const tokenFromFirstSyntax = match[1] || match[2] || match[3]
    const tokensFromSecondSyntax = match[4] && match[4].match(/(\w+\.\w+(\.\w+)?)/g)

    if (tokenFromFirstSyntax) {
      matches.push(tokenFromFirstSyntax)
    }

    if (tokensFromSecondSyntax) {
      matches.push(...tokensFromSecondSyntax)
    }
  }

  return matches.filter(Boolean)
}

export const getInvalidTokens = (value: string, context: RuleContext<any, any>) => {
  const tokens = extractTokens(value)
  if (!tokens.length) return []
  return syncAction('filterInvalidTokenz', getSyncOpts(context), tokens)
}

export const getTokenImport = (context: RuleContext<any, any>) => {
  const imports = _getImports(context)
  return imports.find((imp) => imp.name === 'tokens')
}
