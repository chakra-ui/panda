import { match, P } from 'ts-pattern'
import type { ESLintArrayExpression, ESLintObjectExpression, ESLintStringLiteral } from 'vue-eslint-parser/ast'
import { Node } from './node'
import { stripQuotes } from './strip-quotes'

export function isPrimitiveLiteral(node: any) {
  return Node.isStringLiteral(node) || Node.isNumericLiteral(node) || Node.isBooleanLiteral(node)
}

export function extractValue(value: any): any {
  return match(value)
    .when(
      (node): node is ESLintStringLiteral => Node.isStringLiteral(node) || Node.isNoSubstitutionTemplateLiteral(node),
      ({ value }) => value.replaceAll(/[\n\s]+/g, ' '),
    )
    .when(isPrimitiveLiteral, ({ value }) => value)
    .when(Node.isNullLiteral, () => null)
    .when(Node.isObjectLiteralExpression, extractObjectLiteral)
    .when(Node.isArrayLiteralExpression, extractArrayLiteral)
    .otherwise(() => {
      return undefined
    })
}

export function extractObjectLiteral(node: ESLintObjectExpression) {
  const data: Record<string, any> = {}

  const properties = node.properties

  for (const property of properties) {
    match(property)
      .with({ type: 'Property', key: { name: P.select('key') }, value: P.select('value') }, (prop) => {
        const key = stripQuotes(prop.key)
        const value = extractValue(prop.value)
        if (value !== undefined) {
          data[key] = value
        }
      })
      .otherwise(() => void 0)
  }

  return data
}

export function extractArrayLiteral(node: ESLintArrayExpression) {
  const result: any[] = []

  node.elements.forEach((child) => {
    match(child)
      .when(isPrimitiveLiteral, ({ value }) => {
        result.push(value)
      })
      .when(Node.isUndefinedLiteral, () => {
        result.push(undefined)
      })
      .when(Node.isNullLiteral, () => {
        result.push(null)
      })
      .when(Node.isObjectLiteralExpression, (child) => {
        result.push(extractObjectLiteral(child))
      })
      .when(Node.isArrayLiteralExpression, (child) => {
        result.push(extractArrayLiteral(child))
      })
      .otherwise(() => {
        // no op
      })
  })

  return result
}
