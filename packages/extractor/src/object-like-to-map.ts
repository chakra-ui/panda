import type { Node } from 'ts-morph'
import { box } from './box'
import type { MaybeObjectLikeBoxReturn } from './maybe-object-like-box'
import { BoxNodeLiteral, BoxNodeObject, isBoxNode, type BoxNode, type MapTypeValue } from './box-factory'

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
        const boxed = box.cast(value, maybeObject.getNode() ?? node, maybeObject.getStack() ?? [])
        return [key, boxed || null]
      })
      .filter(([, value]) => value !== null) as Array<[string, BoxNodeObject | BoxNodeLiteral]>,
  )
}
