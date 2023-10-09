type CallbackFn = (key: string, value: any, path: string, depth: number) => void

export const isObjectOrArray = (obj: unknown) => typeof obj === 'object' && obj !== null
const defaultOptions = { separator: '.', maxDepth: Infinity }

export function traverse(
  obj: any,
  callback: CallbackFn,
  options: { separator: string; maxDepth?: number } = defaultOptions,
  path = '',
  depth: number = 0,
): void {
  const maxDepth = options.maxDepth ?? defaultOptions.maxDepth
  const separator = options.separator ?? defaultOptions.separator

  // Check if the passed argument is an object or an array, and if the maximum depth has been reached
  if (depth > maxDepth || obj === null || typeof obj !== 'object') {
    return
  }

  const keys = Object.keys(obj)

  for (let i = 0, len = keys.length; i < len; i++) {
    const key = keys[i]
    const value = obj[key]
    const isObj = isObjectOrArray(value)
    // const newPath = isObj ? (path ? `${path}${separator}${key}` : key) : ''
    const newPath = path ? `${path}${separator}${key}` : key
    // console.log({ t: true, key, value, path, newPath, isObj, depth })

    callback(key, value, newPath, depth)

    // If the value is also an object or array, recurse into it
    if (isObj) {
      traverse(value, callback, options, newPath, depth + 1)
    }
  }
}
