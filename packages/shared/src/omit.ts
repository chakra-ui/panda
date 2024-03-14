import { traverse } from './traverse'

export const omit = <T, K extends keyof T | (string & {})>(obj: T, paths: K[]): Omit<T, K> => {
  const result = { ...obj }

  traverse(result, ({ path, parent, key }) => {
    if (paths.includes(path as K)) {
      delete (parent as any)[key]
    }
  })

  return result as Omit<T, K>
}
