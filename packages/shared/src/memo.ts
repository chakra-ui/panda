export const memo = <T extends (...args: any[]) => any>(fn: T): T => {
  const cache = new Map()
  const stringCache = new Map()

  const get = (...args: any[]) => {
    const isSingleString = args.length === 1 && typeof args[0] === 'string'
    const store = isSingleString ? stringCache : cache
    const key = isSingleString ? args[0] : JSON.stringify(args)

    if (store.has(key)) {
      return store.get(key)
    }

    const result = fn(...args)
    store.set(key, result)
    return result
  }

  return get as T
}
