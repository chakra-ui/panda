import type { TSESTree } from '@typescript-eslint/utils'

import { isNodeOfType } from '@typescript-eslint/utils/ast-utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

export type Node = TSESTree.Node

export const isIdentifier = isNodeOfType(AST_NODE_TYPES.Identifier)

export const isLiteral = isNodeOfType(AST_NODE_TYPES.Literal)

export const isTemplateLiteral = isNodeOfType(AST_NODE_TYPES.TemplateLiteral)

export const isMemberExpression = isNodeOfType(AST_NODE_TYPES.MemberExpression)

export const isVariableDeclaration = isNodeOfType(AST_NODE_TYPES.VariableDeclaration)

export const isJSXMemberExpression = isNodeOfType(AST_NODE_TYPES.JSXMemberExpression)

export const isJSXOpeningElement = isNodeOfType(AST_NODE_TYPES.JSXOpeningElement)

export const isJSXExpressionContainer = isNodeOfType(AST_NODE_TYPES.JSXExpressionContainer)

export const isJSXAttribute = isNodeOfType(AST_NODE_TYPES.JSXAttribute)

export const isJSXIdentifier = isNodeOfType(AST_NODE_TYPES.JSXIdentifier)

export const isCallExpression = isNodeOfType(AST_NODE_TYPES.CallExpression)

export const isImportDeclaration = isNodeOfType(AST_NODE_TYPES.ImportDeclaration)

export const isImportSpecifier = isNodeOfType(AST_NODE_TYPES.ImportSpecifier)
