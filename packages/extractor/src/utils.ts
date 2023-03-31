import { JsxOpeningElement, JsxSelfClosingElement, Node } from 'ts-morph'

type Nullable<T> = T | null | undefined

export const isNotNullish = <T>(element: Nullable<T>): element is T => element != null
export const isNullish = <T>(element: Nullable<T>): element is null | undefined => element == null

/** Returns true if typeof value is object && not null */
export const isObject = (value: any): value is object => value !== null && typeof value === 'object'

/** Returns true if value extends basic Object prototype and is not a Date */
export const isObjectLiteral = <T>(value: any): value is T extends unknown ? Record<string, any> : T =>
  isObject(value) && value.constructor.name === 'Object'

export const unwrapExpression = (node: Node): Node => {
  // Object as any => Object
  if (Node.isAsExpression(node)) {
    return unwrapExpression(node.getExpression())
  }

  // (Object) => Object
  if (Node.isParenthesizedExpression(node)) {
    return unwrapExpression(node.getExpression())
  }

  // "red"! => "red"
  if (Node.isNonNullExpression(node)) {
    return unwrapExpression(node.getExpression())
  }

  // <T>Object => Object
  if (Node.isTypeAssertion(node)) {
    return unwrapExpression(node.getExpression())
  }

  return node
}

export const unwrapArray = <T>(array: T[]): T | T[] => {
  if (array.length === 1) {
    return array[0]!
  }

  return array
}

export const unquote = (str: string) => {
  if (str.startsWith('"') && str.endsWith('"')) return str.slice(1, -1)
  if (str.startsWith("'") && str.endsWith("'")) return str.slice(1, -1)
  return str
}

export const getComponentName = (node: JsxOpeningElement | JsxSelfClosingElement) => {
  const tagNameNode = node.getTagNameNode()
  if (Node.isPropertyAccessExpression(tagNameNode)) {
    return tagNameNode.getText()
  }

  return tagNameNode.getText()
}

const whitespaceRegex = /\s+/g
export const trimWhitespace = (str: string) => {
  return str.replaceAll(whitespaceRegex, ' ')
}
