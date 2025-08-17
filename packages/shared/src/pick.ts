import { traverse } from './traverse'
import { deepSet } from './deep-set'
import { splitDotPath } from './split'

export const pick = <T, K extends keyof T | (string & {})>(obj: T, paths: K[]): Partial<T> => {
  const result = {} as any

  traverse(obj, ({ path, value }) => {
    if (paths.includes(path as K)) {
      // Set the value at the path in the result object using deepSet
      const pathParts = splitDotPath(path as string)
      deepSet(result, pathParts, value)
    }
  })

  return result
}
