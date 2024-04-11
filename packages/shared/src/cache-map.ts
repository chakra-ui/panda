export class CacheMap<K, V> implements Map<K, V> {
  private cache = new Map<K, V>()
  private previousCache = new Map<K, V>()
  private cacheSize = 0

  constructor(private maxCacheSize = 500) {}

  private update = (key: K, value: V): void => {
    this.cache.set(key, value)
    this.cacheSize++
    console.log(key, this.cacheSize, this.maxCacheSize)

    if (this.cacheSize > this.maxCacheSize) {
      this.cacheSize = 0
      this.previousCache = this.cache
      this.cache = new Map()
    }
  }

  get = (key: K): V | undefined => {
    let value = this.cache.get(key)
    if (value !== undefined) return value
    if ((value = this.previousCache.get(key)) !== undefined) {
      this.update(key, value)
      return value
    }
  }

  set = (key: K, value: V) => {
    if (this.cache.has(key)) {
      this.cache.set(key, value)
    } else {
      this.update(key, value)
    }

    return this
  }

  has = (key: K): boolean => {
    return this.cache.has(key)
  }

  delete = (key: K): boolean => {
    return this.cache.delete(key)
  }

  get size() {
    return this.cache.size
  }

  clear = () => {
    this.cache.clear()
    this.previousCache.clear()
  }

  forEach = (fn: (value: V, key: K, map: Map<K, V>) => void) => {
    this.cache.forEach(fn)
  }

  entries = () => {
    return this.cache.entries()
  }

  keys = () => {
    return this.cache.keys()
  }

  values = () => {
    return this.cache.values()
  };

  [Symbol.iterator] = () => {
    return this.cache[Symbol.iterator]()
  };

  [Symbol.toStringTag] = 'CacheMap'

  toJSON = () => {
    return this.cache
  }
}
