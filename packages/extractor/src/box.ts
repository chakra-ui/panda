import type { Node } from 'ts-morph'
import { getTypeOfLiteral } from './get-typeof-literal'
import { toBoxNode } from './to-box-node'
import {
  BoxNodeConditional,
  BoxNodeEmptyInitializer,
  BoxNodeArray,
  BoxNodeLiteral,
  BoxNodeMap,
  BoxNodeObject,
  BoxNodeUnresolvable,
  type BoxNode,
  type MapTypeValue,
} from './box-factory'
import type { EvaluatedObjectResult, PrimitiveType } from './types'

export const box = {
  object(value: EvaluatedObjectResult, node: Node, stack: Node[]) {
    return new BoxNodeObject({ type: 'object', value, node, stack })
  },
  literal(value: PrimitiveType, node: Node, stack: Node[]) {
    return new BoxNodeLiteral({ type: 'literal', value, kind: getTypeOfLiteral(value), node, stack })
  },
  map(value: MapTypeValue, node: Node, stack: Node[]) {
    return new BoxNodeMap({ type: 'map', value, node, stack })
  },
  array(value: BoxNode[], node: Node, stack: Node[]) {
    return new BoxNodeArray({ type: 'array', value, node, stack })
  },
  conditional(whenTrue: BoxNode, whenFalse: BoxNode, node: Node, stack: Node[]) {
    return new BoxNodeConditional({ type: 'conditional', whenTrue, whenFalse, node, stack })
  },
  from: toBoxNode,
  //
  emptyObject: (node: Node, stack: Node[]) => {
    return new BoxNodeObject({ type: 'object', value: {}, isEmpty: true, node, stack })
  },
  emptyInitializer: (node: Node, stack: Node[]) => {
    return new BoxNodeEmptyInitializer({ type: 'empty-initializer', node, stack })
  },
  unresolvable: (node: Node, stack: Node[]) => {
    return new BoxNodeUnresolvable({ type: 'unresolvable', node, stack })
  },
  fallback(node: BoxNode): BoxNode {
    return <BoxNode>{
      value: undefined,
      getNode: () => node.getNode(),
      getStack: () => node.getStack(),
    }
  },
  /**
   * box.type === “object” -> object that was resolved using ts-evaluator, most likely from a
   * complex condition OR a simple CallExpression eval result, we don’t have access to individual
   * AST nodes here so we need the distinction
   */
  isObject(value: BoxNode | undefined): value is BoxNodeObject {
    return value?.type === 'object'
  },
  isLiteral(value: BoxNode | undefined): value is BoxNodeLiteral {
    return value?.type === 'literal'
  },
  /**
   * box.type === “map” -> basically any object that was statically analyzable, we store each
   * prop + value in a Map
   */
  isMap(value: BoxNode | undefined): value is BoxNodeMap {
    return value?.type === 'map'
  },
  isRecipe(value: BoxNode | undefined): value is BoxNodeMap {
    return box.isMap(value) && value.isRecipe()
  },
  isArray(value: BoxNode | undefined): value is BoxNodeArray {
    return value?.type === 'array'
  },
  isUnresolvable(value: BoxNode | undefined): value is BoxNodeUnresolvable {
    return value?.type === 'unresolvable'
  },
  isConditional(value: BoxNode | undefined): value is BoxNodeConditional {
    return value?.type === 'conditional'
  },
  isEmptyInitializer(value: BoxNode | undefined): value is BoxNodeEmptyInitializer {
    return value?.type === 'empty-initializer'
  },
  isNumberLiteral(node: BoxNode | undefined): node is BoxNodeLiteral {
    return box.isLiteral(node) && node.kind === 'number'
  },
  hasValue: (node: BoxNode | undefined): node is BoxNodeLiteral | BoxNodeObject | BoxNodeMap | BoxNodeArray => {
    return box.isObject(node) || box.isLiteral(node) || box.isMap(node) || box.isArray(node)
  },
}
