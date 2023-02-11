import type {
  ESLintArrayExpression,
  ESLintLiteral,
  ESLintNullLiteral,
  ESLintObjectExpression,
  ESLintStringLiteral,
  VExpressionContainer,
} from 'vue-eslint-parser/ast'

export const Node = {
  isStringLiteral(node: any): node is ESLintStringLiteral {
    return (node.type === 'Literal' || node.type === 'VLiteral') && typeof node.value === 'string'
  },
  isNumericLiteral(node: any): node is ESLintStringLiteral {
    return node.type === 'Literal' && typeof node.value === 'number'
  },
  isBooleanLiteral(node: any): node is ESLintStringLiteral {
    return node.type === 'Literal' && typeof node.value === 'boolean'
  },
  isNoSubstitutionTemplateLiteral(node: any): node is ESLintStringLiteral {
    return node.type === 'TemplateLiteral' && node.quasis.length === 1
  },
  isNullLiteral(node: any): node is ESLintNullLiteral {
    return node.type === 'Literal' && node.value === null
  },
  isObjectLiteralExpression(node: any): node is ESLintObjectExpression {
    return node.type === 'ObjectExpression'
  },
  isArrayLiteralExpression(node: any): node is ESLintArrayExpression {
    return node.type === 'ArrayExpression'
  },
  isUndefinedLiteral(node: any): node is ESLintLiteral {
    return node.type === 'Property' && node.value.name === 'undefined'
  },
  isJsxExpression(node: any): node is VExpressionContainer {
    return node.type === 'VExpressionContainer'
  },
}
