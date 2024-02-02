import { deepSet, traverse } from '@pandacss/shared'

const isObject = (v: any) => Object.prototype.toString.call(v) === '[object Object]'
export const isFunction = (v: any) => typeof v === 'function'

export function mergeWith(target: any, ...sources: any[]) {
  const customizer = sources.pop()

  for (const source of sources) {
    for (const key in source) {
      const merged = customizer(target[key], source[key])

      if (merged === undefined) {
        if (isObject(target[key]) && isObject(source[key])) {
          target[key] = mergeWith({}, target[key], source[key], customizer)
        } else {
          target[key] = source[key]
        }
      } else {
        target[key] = merged
      }
    }
  }

  return target
}

export function assign(target: any, ...sources: any[]) {
  for (const source of sources) {
    for (const key in source) {
      if (!target?.hasOwnProperty?.(key)) {
        target[key] = source[key]
      }
    }
  }

  return target
}

const pick = <T, K extends keyof T | (string & {})>(obj: T, paths: K[]): Pick<T, K extends keyof T ? K : any> => {
  const result = {} as Record<string, any>

  traverse(obj, ({ path }) => {
    if (paths.includes(path as K)) {
      result[path] = obj[path as keyof T]
    }
  })

  return result as Pick<T, K extends keyof T ? K : any>
}

const omit = <T, K extends keyof T | (string & {})>(obj: T, paths: K[]): Omit<T, K> => {
  const result = { ...obj }

  traverse(obj, ({ path, parent, key }) => {
    if (paths.includes(path as K)) {
      delete (parent as any)[key]
    }
  })

  return result as Omit<T, K>
}

const flatten = <T extends Record<string, any>>(values: T): Record<string, any> => {
  const result: Record<string, any> = {}

  traverse(values, ({ path, value }) => {
    result[path] = value
  })

  return result
}

export const utils = {
  deepSet,
  flatten,
  pick,
  omit,
  traverse,
}
