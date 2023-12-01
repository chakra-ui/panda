import { box } from './box'
import type { BoxNode } from './box-factory'
import type { LiteralObject, LiteralValue } from './types'
import { isNotNullish } from './utils'
import { Node } from 'ts-morph'

const makeObjAt = (path: string[], value: unknown) => {
  if (!path.length) return value as LiteralObject

  const obj = {} as any
  let current = obj
  for (let i = 0; i < path.length; i++) {
    const key = path[i]
    if (i === path.length - 1) {
      current[key] = value
    } else {
      current[key] = {}
      current = current[key] as LiteralObject
    }
  }

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
  if (!node) return
  if (box.isConditional(node)) {
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
  }

  if (box.isLiteral(node) || box.isObject(node)) {
    return node.value
  }

  if (box.isEmptyInitializer(node)) {
    return true
  }

  if (box.isMap(node)) {
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

    const obj = {} as LiteralObject
    node.value.forEach((propNode, key) => {
      const value = getLiteralValue(propNode, Object.assign({}, ctx, { path: ctx.path.concat(key), parent: node }))
      if (isNotNullish(value)) {
        obj[key] = value
      }
    })

    return obj
  }

  if (box.isArray(node)) {
    return node.value.flatMap((elementNode, index) =>
      getLiteralValue(elementNode, Object.assign({}, ctx, { path: ctx.path.concat(String(index)), parent: node })),
    )
  }
}

type BoxNodeType = BoxNode | BoxNode[] | undefined
type CacheMap = WeakMap<BoxNode, Unboxed>

interface UnboxContext {
  path: string[]
  parent: BoxNode | undefined
  cache: CacheMap
  /** @example <ColorBox color={unresolvableIdentifier ? "light.100" : "dark.200" } /> */
  conditions: LiteralObject[]
  /** @example <ColorBox {...(someCondition && { color: "blue.100" })} /> */
  spreadConditions: LiteralObject[] // there is no specific upside to having this separated from conditions but it's easier to debug
}
export interface Unboxed {
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

  let raw: LiteralObject
  if (Array.isArray(node)) {
    raw = node.map((boxNode) => getLiteralValue(boxNode, _ctx)).filter(isNotNullish)[0] as LiteralObject
  } else {
    raw = getLiteralValue(node, _ctx) as LiteralObject
  }

  const result: Unboxed = { raw: raw ?? {}, conditions: _ctx.conditions, spreadConditions: _ctx.spreadConditions }

  if (raw) {
    cache.set(node, result)
  }

  return result
}
