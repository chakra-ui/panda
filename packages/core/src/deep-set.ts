import type { Dict } from '@pandacss/types'

export const deepSet = <T extends Dict>(obj: T, path: string[], value: Dict) => {
  if (!path.length) return Object.assign(obj, value) as T

  let current = obj as Record<string, any>
  for (let i = 0; i < path.length; i++) {
    const key = path[i]
    if (!current[key]) {
      current[key] = {}
    }

    if (i === path.length - 1) {
      Object.assign(current[key], value)
    } else {
      current = current[key]
    }
  }

  return obj
}
