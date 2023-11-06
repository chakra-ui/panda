import type { Node } from 'ts-morph'
import type { EvaluatedObjectResult, LiteralValue, PrimitiveType } from './types'
import { isArray, isNullish, isObject, isPrimitiveType } from './utils'
import { box } from './box'
import { BoxNodeLiteral, BoxNodeObject, type BoxNode, isBoxNode } from './box-factory'

export function toBoxNode<Value extends PrimitiveType>(value: Value, node: Node, stack: Node[]): BoxNodeLiteral

export function toBoxNode<Value extends EvaluatedObjectResult>(value: Value, node: Node, stack: Node[]): BoxNodeObject

export function toBoxNode<Value extends PrimitiveType[]>(value: Value, node: Node, stack: Node[]): BoxNodeLiteral[]

export function toBoxNode<Value extends BoxNode | BoxNode[]>(value: Value, node: Node, stack: Node[]): Value

export function toBoxNode<Value extends LiteralValue>(
  value: Value,
  node: Node,
  stack: Node[],
): Value extends unknown[] ? BoxNodeLiteral : Value extends PrimitiveType ? BoxNodeLiteral : BoxNodeObject

export function toBoxNode<Value extends PrimitiveType | BoxNode>(
  value: Value,
  node: Node,
  stack: Node[],
): BoxNodeLiteral

export function toBoxNode<Value>(value: Value, node: Node, stack: Node[]): BoxNode | BoxNode[] | undefined {
  if (isNullish(value)) return
  if (isBoxNode(value)) return value
  if (isObject(value)) return box.object(value as EvaluatedObjectResult, node, stack)
  if (isArray(value)) {
    if (value.length === 1) return toBoxNode(value[0], node, stack)
    return value.map((item) => toBoxNode(item, node, stack) as BoxNode)
  }
  if (isPrimitiveType(value)) return box.literal(value, node, stack)
}
