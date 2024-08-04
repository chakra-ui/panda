import { isObject } from './assert'
import { mergeProps } from './merge-props'

type Dict = Record<string, any>

export const deepSet = <T extends Dict>(target: T, path: string[], value: Dict | string) => {
  const isValueObject = isObject(value)

  if (!path.length && isValueObject) {
    return mergeProps(target, value) as T
  }

  let current = target as Dict

  for (let i = 0; i < path.length; i++) {
    const key = path[i]

    current[key] ||= {}

    if (i === path.length - 1) {
      if (isValueObject && isObject(current[key])) {
        current[key] = mergeProps(current[key], value)
      } else {
        current[key] = value
      }
    } else {
      current = current[key]
    }
  }

  return target
}
