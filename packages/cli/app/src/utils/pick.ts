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
