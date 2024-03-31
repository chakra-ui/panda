import type { Node } from 'ts-morph'
import { box } from './box'
import { BoxNodeLiteral, BoxNodeMap, BoxNodeObject, isBoxNode, type BoxNode, type MapTypeValue } from './box-factory'

type MaybeObjectLikeBoxReturn = BoxNodeObject | BoxNodeMap | undefined
export const objectLikeToMap = (maybeObject: MaybeObjectLikeBoxReturn, node: Node): MapTypeValue => {
  if (!maybeObject) {
    return new Map<string, BoxNode>()
  }

  if (!isBoxNode(maybeObject)) {
    return new Map<string, BoxNode>(Object.entries(maybeObject))
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
