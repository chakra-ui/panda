import { Arr, Bool, pipe } from 'lil-fp'
import { P, match } from 'ts-pattern'
import { box } from './box'
import type { BoxNode } from './box-factory'
import type { LiteralObject, LiteralValue } from './types'
import { isNotNullish } from './utils'
import { Node } from 'ts-morph'

const makeObjAt = (path: string[], value: unknown) => {
  if (!path.length) return value as LiteralObject

  const obj = {} as any
  path.reduce((acc, key, i) => {
    const isLast = i === path.length - 1
    acc[key] = isLast ? value : {}
    return isLast ? obj : acc[key]
  }, obj)

  return obj as LiteralObject
}

const makeArrayWithValueAt = (index: number, value: unknown) => {
  if (index < 0) return []

  const arr = [] as any[]
  for (let i = 0; i <= index; i++) {
    arr[i] = i === index ? value : undefined
  }

  return arr as unknown[]
}

const getLiteralValue = (node: BoxNode | undefined, ctx: UnboxContext): LiteralValue | undefined => {
  return match(node)
    .with(P.nullish, () => undefined)
    .when(box.isConditional, (node) => {
      const path = ctx.path
      const whenTrue = getLiteralValue(node.whenTrue, Object.assign({}, ctx, { path, parent: node }))
      const whenFalse = getLiteralValue(node.whenFalse, Object.assign({}, ctx, { path, parent: node }))

      const last = node.getStack().at(-1)
      const maybeIndex = Number(path[path.length - 1])

      // When the conditional is inside an array
      // Insert the value at the index (which is the last element in the path)
      if (last && Node.isArrayLiteralExpression(last) && !Number.isNaN(maybeIndex)) {
        const sliced = path.slice(0, -1)

        if (whenTrue) {
          ctx.conditions.push(makeObjAt(sliced, makeArrayWithValueAt(maybeIndex, whenTrue)))
        }
        if (whenFalse) {
          ctx.conditions.push(makeObjAt(sliced, makeArrayWithValueAt(maybeIndex, whenFalse)))
        }
        return undefined
      }

      if (whenTrue) {
        ctx.conditions.push(makeObjAt(path, whenTrue))
      }
      if (whenFalse) {
        ctx.conditions.push(makeObjAt(path, whenFalse))
      }
      return undefined
    })
    .when(Bool.or(box.isLiteral, box.isObject), (node) => {
      return node.value
    })
    .when(box.isEmptyInitializer, () => {
      return true
    })
    .when(box.isMap, (node) => {
      if (node.spreadConditions) {
        const path = ctx.path
        node.spreadConditions.forEach((spread) => {
          const whenTrue = getLiteralValue(spread.whenTrue, Object.assign({}, ctx, { path, parent: node }))
          const whenFalse = getLiteralValue(spread.whenFalse, Object.assign({}, ctx, { path, parent: node }))

          if (whenTrue) {
            ctx.spreadConditions.push(makeObjAt(path, whenTrue))
          }
          if (whenFalse) {
            ctx.spreadConditions.push(makeObjAt(path, whenFalse))
          }
        })
      }

      return pipe(
        Arr.from(node.value.entries()),
        Arr.map(([key, propNode]) => [
          key,
          getLiteralValue(propNode, Object.assign({}, ctx, { path: ctx.path.concat(key), parent: node })),
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
          getLiteralValue(
            elementNode,
            Object.assign({}, ctx, { path: ctx.path.concat(String(index++)), parent: node }),
          ),
        ),
        (v) => v.flat(),
      )
    })

    .otherwise(() => undefined)
}

type BoxNodeType = BoxNode | BoxNode[] | undefined
type CacheMap = WeakMap<BoxNode, Unboxed>

type UnboxContext = {
  path: string[]
  parent: BoxNode | undefined
  cache: CacheMap
  /** @example <ColorBox color={unresolvableIdentifier ? "light.100" : "dark.200" } /> */
  conditions: LiteralObject[]
  /** @example <ColorBox {...(someCondition && { color: "blue.100" })} /> */
  spreadConditions: LiteralObject[] // there is no specific upside to having this separated from conditions but it's easier to debug
}
export type Unboxed = {
  raw: LiteralObject
  conditions: LiteralObject[]
  spreadConditions: LiteralObject[]
}

export const cacheMap: CacheMap = new WeakMap()

const createCache = (map: CacheMap) => ({
  value: map,
  has: (node: BoxNodeType) => map.has(node as any),
  get: (node: BoxNodeType) => map.get(node as any) as Unboxed | undefined,
  set: (node: BoxNodeType, value: any) => map.set(node as any, value),
})

export const unbox = (node: BoxNodeType, ctx?: Pick<UnboxContext, 'cache'>): Unboxed => {
  const _ctx: UnboxContext = {
    cache: ctx?.cache ?? cacheMap,
    ...ctx,
    path: [],
    parent: undefined,
    conditions: [],
    spreadConditions: [],
  }
  const cache = createCache(_ctx.cache)

  if (cache.has(node)) {
    return cache.get(node)!
  }

  const raw = (match(node)
    .with(P.nullish, () => undefined)
    .when(Array.isArray, (node: BoxNode[]) => {
      const value = pipe(
        node,
        Arr.map((boxNode) => getLiteralValue(boxNode, _ctx)),
        Arr.filter(isNotNullish),
        Arr.head,
      )
      cache.set(node, { raw: value, conditions: _ctx.conditions, spreadConditions: _ctx.spreadConditions })
      return value
    })
    .otherwise((node) => {
      const value = getLiteralValue(node, _ctx)
      cache.set(node, { raw: value, conditions: _ctx.conditions, spreadConditions: _ctx.spreadConditions })
      return value
    }) ?? {}) as LiteralObject

  return { raw, conditions: _ctx.conditions, spreadConditions: _ctx.spreadConditions }
}
