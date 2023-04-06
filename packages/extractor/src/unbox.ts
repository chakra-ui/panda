import { Arr, Bool, pipe } from 'lil-fp'
import { P, match } from 'ts-pattern'
import { box } from './box'
import type { BoxNode } from './box-factory'
import type { LiteralValue } from './types'
import { isNotNullish } from './utils'

const getLiteralValue = (node: BoxNode | undefined, cache: WeakMap<BoxNode, unknown>): LiteralValue | undefined => {
  return match(node)
    .with(P.nullish, () => undefined)
    .when(box.isConditional, () => undefined)
    .when(Bool.or(box.isLiteral, box.isObject), (node) => {
      return node.value
    })
    .when(box.isMap, (node) => {
      return pipe(
        Arr.from(node.value.entries()),
        Arr.map(([key, value]) => [key, unbox(value, cache)]),
        Arr.filter(([, value]) => isNotNullish(value)),
        Object.fromEntries,
      )
    })
    .when(box.isArray, (node) => {
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
        Arr.map((boxNode) => getLiteralValue(boxNode, cache.value)),
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
