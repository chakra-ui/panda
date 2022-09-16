type Predicate<R = any> = (value: any, path: string[]) => R

function isObject(value: any): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export type MappedObject<T, K> = {
  [Prop in keyof T]: T[Prop] extends Array<any>
    ? MappedObject<T[Prop][number], K>[]
    : T[Prop] extends Record<string, unknown>
    ? MappedObject<T[Prop], K>
    : K
}

export function walkObject<T, K>(
  target: T,
  predicate: Predicate<K>,
  options: { maxDepth?: number } = {},
): MappedObject<T, ReturnType<Predicate<K>>> {
  const { maxDepth = Infinity } = options

  function inner(value: any, path: string[] = []): any {
    if (isObject(value) || Array.isArray(value)) {
      const result: Record<string, string> = {}
      for (const [key, child] of Object.entries(value)) {
        const childPath = [...path, key]
        if (childPath.length > maxDepth) {
          return predicate(value, path)
        }
        result[key] = inner(child, childPath)
      }
      return result
    }

    return predicate(value, path)
  }

  return inner(target)
}

export function mapObject(obj: any, fn: (value: any) => any) {
  if (!isObject(obj)) return fn(obj)
  return walkObject(obj, (value) => fn(value))
}
