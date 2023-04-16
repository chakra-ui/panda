import type { Node } from 'ts-morph'
import { box } from './box'
import {
  BoxNodeConditional,
  BoxNodeLiteral,
  BoxNodeMap,
  BoxNodeObject,
  BoxNodeUnresolvable,
  isBoxNode,
  type BoxNode,
  type MapTypeValue,
} from './box-factory'

type MaybeObjectLikeBoxReturn = BoxNodeObject | BoxNodeMap | BoxNodeUnresolvable | BoxNodeConditional | undefined
export const objectLikeToMap = (maybeObject: MaybeObjectLikeBoxReturn, node: Node): MapTypeValue => {
  if (!maybeObject) {
    return new Map<string, BoxNode>()
  }

  if (!isBoxNode(maybeObject)) {
    return new Map<string, BoxNode>(Object.entries(maybeObject))
  }

  if (box.isUnresolvable(maybeObject) || box.isConditional(maybeObject)) {
    return new Map<string, BoxNode>()
  }

  if (box.isMap(maybeObject)) {
    return maybeObject.value
  }

  return new Map<string, BoxNode>(
    Object.entries(maybeObject.value)
      .map(([key, value]) => {
        const boxed = box.from(value, maybeObject.getNode() ?? node, maybeObject.getStack() ?? [])
        return [key, boxed || null]
      })
      .filter(([, value]) => value !== null) as Array<[string, BoxNodeObject | BoxNodeLiteral]>,
  )
}
