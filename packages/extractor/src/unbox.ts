import { Arr, Bool, pipe } from 'lil-fp'
import { P, match } from 'ts-pattern'
import { BoxNodeType, type BoxNode, type LiteralValue } from './type-factory'
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

type NodeType = BoxNode | BoxNode[] | undefined
type CacheMap = WeakMap<BoxNode, unknown>

export const cacheMap: CacheMap = new WeakMap()

const createCache = (map: CacheMap) => ({
  value: map,
  has: (node: NodeType) => map.has(node as any),
  get: (node: NodeType) => map.get(node as any) as LiteralValue | undefined,
  set: (node: NodeType, value: any) => map.set(node as any, value),
})

const isArray = (node: NodeType): node is BoxNode[] => Array.isArray(node)

export const unbox = (node: NodeType, unboxCache: CacheMap = cacheMap): LiteralValue | undefined => {
  const cache = createCache(unboxCache)
  return match(node)
    .with(P.nullish, () => undefined)
    .when(cache.has, cache.get)
    .when(isArray, (node) => {
      const value = pipe(
        node,
        Arr.map((valueType) => getLiteralValue(valueType, cache.value)),
        Arr.filter(isNotNullish),
        Arr.head,
      )
      cache.set(node, value)
      return value
    })
    .otherwise((node) => {
      const value = getLiteralValue(node, cache.value)
      cache.set(node, value)
      return value
    })
}
