/** Pick given properties in object */
export function pick<T, K extends keyof T>(obj: T, paths: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>

  Object.keys(obj as any).forEach((key) => {
    if (!paths.includes(key as K)) return
    // @ts-expect-error
    result[key] = obj[key]
  })

  return result as Pick<T, K>
}

/** Omit given properties from object */
export function omit<T extends Record<string, any>, K extends keyof T>(object: T, keys: K[]) {
  const result: Record<string, any> = {}

  Object.keys(object).forEach((key) => {
    if (keys.includes(key as K)) return
    result[key] = object[key]
  })

  return result as Omit<T, K>
}
