import { isPlainObject } from './shared'

interface TraverseItem {
  value: unknown
  path: string
  depth: number
  parent: unknown[] | Record<string, unknown>
  key: string
}

interface TraverseOptions {
  separator?: string | undefined
  maxDepth?: number | undefined
}

/**
 * Shared helpers passed as `utils` to the `config:resolved` and `preset:resolved` hooks.
 */
export const configResolvedUtils = {
  omit<T extends object>(obj: T, paths: string[]): T {
    const clone = cloneValue(obj)
    for (const path of paths) {
      deleteAtPath(clone, path)
    }
    return clone
  },
  pick<T extends object>(obj: T, paths: string[]): Partial<T> {
    const result: Record<string, unknown> = {}
    for (const path of paths) {
      const value = getAtPath(obj, path)
      if (value !== undefined) {
        setAtPath(result, path, value)
      }
    }
    return result as Partial<T>
  },
  traverse(obj: unknown, callback: (item: TraverseItem) => void, options: TraverseOptions = {}): void {
    traverseValue(obj, callback, options)
  },
}

function cloneValue<T>(value: T): T {
  // Direct loops over a single `Object.keys` array instead of
  // `Object.fromEntries(Object.entries().map())`, which allocates three
  // intermediate arrays (plus a [key, value] tuple per property) per node.
  if (Array.isArray(value)) {
    const len = value.length
    const out = new Array(len)
    for (let i = 0; i < len; i++) out[i] = cloneValue(value[i])
    return out as T
  }
  if (!isPlainObject(value)) return value

  const source = value as Record<string, unknown>
  const out: Record<string, unknown> = {}
  const keys = Object.keys(source)
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    out[key] = cloneValue(source[key])
  }
  return out as T
}

function pathParts(path: string) {
  return path.split('.').filter(Boolean)
}

function getAtPath(value: unknown, path: string): unknown {
  let current = value
  for (const part of pathParts(path)) {
    if (!isPlainObject(current) && !Array.isArray(current)) return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

function setAtPath(target: Record<string, unknown>, path: string, value: unknown): void {
  const parts = pathParts(path)
  let current = target

  parts.forEach((part, index) => {
    if (index === parts.length - 1) {
      current[part] = cloneValue(value)
      return
    }

    const next = current[part]
    if (!isPlainObject(next)) {
      current[part] = {}
    }
    current = current[part] as Record<string, unknown>
  })
}

function deleteAtPath(target: unknown, path: string): void {
  const parts = pathParts(path)
  const key = parts.pop()
  if (!key) return

  let current = target
  for (const part of parts) {
    if (!isPlainObject(current) && !Array.isArray(current)) return
    current = (current as Record<string, unknown>)[part]
  }

  if (isPlainObject(current) || Array.isArray(current)) {
    delete (current as Record<string, unknown>)[key]
  }
}

function traverseValue(
  value: unknown,
  callback: (item: TraverseItem) => void,
  options: TraverseOptions,
  parent?: unknown[] | Record<string, unknown>,
  key?: string,
  path = '',
  depth = 0,
): void {
  if (parent && key !== undefined) {
    callback({ value, path, depth, parent, key })
  }
  if (options.maxDepth !== undefined && depth >= options.maxDepth) return
  if (!isPlainObject(value) && !Array.isArray(value)) return

  const separator = options.separator ?? '.'
  const container = value as unknown[] | Record<string, unknown>
  const keys = Object.keys(container)
  for (let i = 0; i < keys.length; i++) {
    const childKey = keys[i]
    traverseValue(
      (container as Record<string, unknown>)[childKey],
      callback,
      options,
      container,
      childKey,
      joinPath(path, childKey, separator),
      depth + 1,
    )
  }
}

function joinPath(parent: string, key: string, separator: string) {
  return parent ? `${parent}${separator}${key}` : key
}
