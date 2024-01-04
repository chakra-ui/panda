import type { Dict } from '@pandacss/types'

export const deepSet = <T extends Dict>(target: T, path: string[], value: Dict | string) => {
  const isValueObject = typeof value === 'object' && value !== null
  if (!path.length && isValueObject) return Object.assign(target, value) as T

  let current = target as Record<string, any>
  for (let i = 0; i < path.length; i++) {
    const key = path[i]
    if (!current[key]) {
      current[key] = {}
    }

    if (i === path.length - 1) {
      if (isValueObject) {
        Object.assign(current[key], value)
      } else {
        current[key] = value
      }
    } else {
      current = current[key]
    }
  }

  return target
}
