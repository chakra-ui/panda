import { Arr, Bool, pipe } from 'lil-fp'
import { P, match } from 'ts-pattern'
import { box } from './box'
import type { BoxNode } from './box-factory'
import type { LiteralValue } from './types'
import { isNotNullish } from './utils'

const append = (path: string, key: string | number) => {
  if (!path || (path.length === 1 && path[0] === '#')) return `#${key}`
  return path + '.' + key
}

const getLiteralValue = (node: BoxNode | undefined, ctx: UnboxContext): LiteralValue | undefined => {
  return match(node)
    .with(P.nullish, () => undefined)
    .when(box.isConditional, (node) => {
      const path = ctx.path || '#'
      // console.log('conditional', ctx.path, node)

      const whenTrue = getLiteralValue(node.whenTrue, Object.assign({}, ctx, { path, parent: node }))
      const whenFalse = getLiteralValue(node.whenFalse, Object.assign({}, ctx, { path, parent: node }))

      // if we can't resolve any of the 2 branches, ignore it
      if (whenTrue || whenFalse) {
        // node, parent: ctx.parent,
        ctx.conditions.push({ path, whenTrue, whenFalse })
      }
      return undefined
    })
    .when(Bool.or(box.isLiteral, box.isObject), (node) => {
      return node.value
    })
    .when(box.isMap, (node) => {
      if (node.spreadConditions) {
        const path = ctx.path || '#'
        node.spreadConditions.forEach((spread) => {
          const whenTrue = getLiteralValue(spread.whenTrue, Object.assign({}, ctx, { path, parent: node }))
          const whenFalse = getLiteralValue(spread.whenFalse, Object.assign({}, ctx, { path, parent: node }))

          // if we can't resolve any of the 2 branches, ignore it
          if (whenTrue || whenFalse) {
            ctx.spreadConditions.push({ path, whenTrue, whenFalse })
          }
        })
      }

      return pipe(
        Arr.from(node.value.entries()),
        Arr.map(([key, propNode]) => [
          key,
          getLiteralValue(propNode, Object.assign({}, ctx, { path: append(ctx.path, key), parent: node })),
        ]),
        Arr.filter(([, value]) => isNotNullish(value)),
        Object.fromEntries,
      )
    })
    .when(box.isArray, (node) => {
      let index = 0
      return pipe(
        node.value,
        Arr.map((elementNode) =>
          getLiteralValue(elementNode, Object.assign({}, ctx, { path: append(ctx.path, index++), parent: node })),
        ),
        Arr.filter(isNotNullish),
        (v) => v.flat(),
      )
    })

    .otherwise(() => undefined)
}

type BoxNodeType = BoxNode | BoxNode[] | undefined
type CacheMap = WeakMap<BoxNode, unknown>

type ConditionalPath = {
  // node: BoxNodeConditional
  // parent: BoxNode | undefined
  path: string
  whenTrue: LiteralValue
  whenFalse: LiteralValue
}

type UnboxContext = {
  path: string
  parent: BoxNode | undefined
  // enter: (node: BoxNode) => void
  // exit: (node: BoxNode) => void
  cache: CacheMap
  conditions: ConditionalPath[]
  spreadConditions: ConditionalPath[]
}
type Unboxed = {
  raw: LiteralValue | undefined
  conditions: ConditionalPath[]
  spreadConditions: ConditionalPath[]
}

export const cacheMap: CacheMap = new WeakMap()

const createCache = (map: CacheMap) => ({
  value: map,
  has: (node: BoxNodeType) => map.has(node as any),
  get: (node: BoxNodeType) => map.get(node as any) as LiteralValue | undefined,
  set: (node: BoxNodeType, value: any) => map.set(node as any, value),
})

export const unbox = (node: BoxNodeType, ctx?: Pick<UnboxContext, 'cache'>): Unboxed => {
  const _ctx: UnboxContext = {
    cache: ctx?.cache ?? cacheMap,
    ...ctx,
    path: '',
    parent: undefined,
    conditions: [],
    spreadConditions: [],
  }
  const cache = createCache(_ctx.cache)

  const raw = match(node)
    .with(P.nullish, () => undefined)
    .when(cache.has, cache.get)
    .when(Array.isArray, (node: BoxNode[]) => {
      const value = pipe(
        node,
        Arr.map((boxNode) => getLiteralValue(boxNode, _ctx)),
        Arr.filter(isNotNullish),
        Arr.head,
      )
      cache.set(node, value)
      return value
    })
    .otherwise((node) => {
      const value = getLiteralValue(node, _ctx)
      cache.set(node, value)
      return value
    })

  return { raw, conditions: _ctx.conditions, spreadConditions: _ctx.spreadConditions }
}
