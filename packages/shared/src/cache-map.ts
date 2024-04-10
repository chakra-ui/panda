export class CacheMap<K, V> {
  private cache = new Map<K, V>()
  private previousCache = new Map<K, V>()
  private cacheSize = 0

  constructor(private maxCacheSize = 500) {}

  private update = (key: K, value: V): void => {
    this.cache.set(key, value)
    this.cacheSize++

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

  set = (key: K, value: V): void => {
    if (this.cache.has(key)) {
      this.cache.set(key, value)
    } else {
      this.update(key, value)
    }
  }

  has = (key: K): boolean => {
    return this.cache.has(key)
  }

  delete = (key: K): boolean => {
    return this.cache.delete(key)
  }

  size = (): number => {
    return this.cache.size
  }

  toJSON = () => {
    return this.cache
  }
}
