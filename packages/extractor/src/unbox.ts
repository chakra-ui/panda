import { Arr, pipe, Bool } from 'lil-fp'
import { match, P } from 'ts-pattern'
import { BoxNodeType, type BoxNode, type LiteralValue, type SingleLiteralValue } from './type-factory'
import { isNotNullish } from './utils'

const getLiteralValue = (node: BoxNode | undefined, cache: WeakMap<BoxNode, unknown>): LiteralValue | undefined => {
  return match(node)
    .with(P.nullish, () => undefined)
    .when(BoxNodeType.isConditional, () => undefined)
    .when(Bool.or(BoxNodeType.isLiteral, BoxNodeType.isObject), (node) => {
      return node.value
    })
    .when(BoxNodeType.isMap, (node) => {
      return pipe(
        Arr.from(node.value.entries()),
        Arr.map(([key, value]) => [key, unbox(value, cache)]),
        Arr.filter(([_key, value]) => isNotNullish(value)),
        Object.fromEntries,
      )
    })
    .when(BoxNodeType.isList, (node) => {
      return pipe(
        node.value,
        Arr.map((value) => unbox(value, cache)),
        Arr.filter(isNotNullish),
        (v) => v.flat(),
      )
    })

    .otherwise(() => undefined)
}

export const cacheMap = new WeakMap()

export const unbox = (
  node: BoxNode | BoxNode[] | undefined,
  cache: WeakMap<BoxNode, unknown> = cacheMap,
): LiteralValue | undefined => {
  if (!node) return

  if (cacheMap.has(node)) return cacheMap.get(node)

  if (Array.isArray(node)) {
    const values = node
      .map((valueType) => getLiteralValue(valueType, cache))
      .filter(isNotNullish) as SingleLiteralValue[]

    let result: any = values
    if (values.length === 0) result = undefined
    if (values.length === 1) result = values[0]

    cacheMap.set(node, result)
    return result
  }

  const result = getLiteralValue(node, cache)
  cacheMap.set(node, result)
  return result
}
