import {
  ArrayLiteralExpression,
  BooleanLiteral,
  Node,
  NumericLiteral,
  ObjectLiteralExpression,
  StringLiteral,
} from 'ts-morph'
import { match } from 'ts-pattern'
import { stripQuotes } from './strip-quotes'

export function isPrimitiveLiteral(node: any): node is StringLiteral | NumericLiteral | BooleanLiteral {
  return (
    Node.isStringLiteral(node) || Node.isNumericLiteral(node) || Node.isTrueLiteral(node) || Node.isFalseLiteral(node)
  )
}

export function extractValue(value: any): any {
  return match(value)
    .when(Node.isStringLiteral, (value) => {
      return value.getLiteralValue().replaceAll(/[\n\s]+/g, ' ')
    })
    .when(isPrimitiveLiteral, (value) => {
      return value.getLiteralValue()
    })
    .when(Node.isNullLiteral, () => {
      return null
    })
    .when(Node.isObjectLiteralExpression, (value) => {
      return extractObjectLiteral(value)
    })
    .when(Node.isArrayLiteralExpression, (value) => {
      return extractArrayLiteral(value)
    })
    .otherwise(() => {
      return undefined
    })
}

export function extractObjectLiteral(node: ObjectLiteralExpression) {
  const data: Record<string, any> = {}

  const properties = node.getProperties()

  for (const property of properties) {
    if (Node.isPropertyAssignment(property)) {
      const key = stripQuotes(property.getName())
      const value = property.getInitializer()
      const returnValue = extractValue(value)
      if (returnValue !== undefined) {
        data[key] = returnValue
      }
    }
  }

  return data
}

export function extractArrayLiteral(node: ArrayLiteralExpression) {
  const result: any[] = []

  node.forEachChild((child) => {
    match(child)
      .when(isPrimitiveLiteral, (child) => {
        result.push(child.getLiteralValue())
      })
      .when(Node.isUndefinedKeyword, () => {
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
