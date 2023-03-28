import type { BoxNode, LiteralValue, SingleLiteralValue } from './type-factory'
import { isNotNullish } from './utils'

export const cacheMap = new WeakMap()
const innerGetLiteralValue = (
  node: BoxNode | undefined,
  localCacheMap: WeakMap<BoxNode, unknown>,
): LiteralValue | undefined => {
  if (!node) return
  if (node.isLiteral()) return node.value
  if (node.isObject()) return node.value
  if (node.isMap()) {
    const entries = Array.from(node.value.entries())
      .map(([key, value]) => [key, getBoxLiteralValue(value, localCacheMap)])
      .filter(([_key, value]) => isNotNullish(value))

    return Object.fromEntries(entries)
  }

  if (node.isList()) {
    return node.value.map((value) => getBoxLiteralValue(value, localCacheMap)).filter(isNotNullish) as LiteralValue
  }

  if (node.isConditional()) {
    return [node.whenTrue, node.whenFalse]
      .map((value) => getBoxLiteralValue(value, localCacheMap))
      .filter(isNotNullish)
      .flat()
  }
}

export const getBoxLiteralValue = (
  maybeBox: BoxNode | BoxNode[] | undefined,
  localCacheMap: WeakMap<BoxNode, unknown> = cacheMap,
): LiteralValue | undefined => {
  if (!maybeBox) return
  // logger({ maybeBox });

  if (cacheMap.has(maybeBox)) return cacheMap.get(maybeBox)
  if (Array.isArray(maybeBox)) {
    const values = maybeBox
      .map((valueType) => innerGetLiteralValue(valueType, localCacheMap))
      .filter(isNotNullish) as SingleLiteralValue[]
    // logger({ values });

    let result: any = values
    if (values.length === 0) result = undefined
    if (values.length === 1) result = values[0]

    cacheMap.set(maybeBox, result)
    return result
  }

  const result = innerGetLiteralValue(maybeBox, localCacheMap)
  cacheMap.set(maybeBox, result)
  return result
}
