export class CacheMap<K, V> implements Map<K, V> {
  private cache: Map<K, V>
  private keysInUse: K[]
  private maxCacheSize: number

  constructor(maxCacheSize: number = 500) {
    this.maxCacheSize = maxCacheSize
    this.cache = new Map<K, V>()
    this.keysInUse = []
  }

  get(key: K) {
    if (!this.cache.has(key)) {
      return undefined
    }
    this.updateKeyUsage(key)
    return this.cache.get(key)
  }

  set(key: K, value: V) {
    if (!this.cache.has(key) && this.cache.size === this.maxCacheSize) {
      this.evictLeastRecentlyUsed()
    }
    this.cache.set(key, value)
    this.updateKeyUsage(key)
    return this
  }

  delete(key: K) {
    const result = this.cache.delete(key)
    if (result) {
      const index = this.keysInUse.indexOf(key)
      if (index !== -1) {
        this.keysInUse.splice(index, 1)
      }
    }
    return result
  }

  private updateKeyUsage(key: K) {
    const index = this.keysInUse.indexOf(key)
    if (index !== -1) {
      this.keysInUse.splice(index, 1)
    }
    this.keysInUse.push(key)
  }

  private evictLeastRecentlyUsed() {
    const keyToEvict = this.keysInUse.shift()
    if (keyToEvict !== undefined) {
      this.cache.delete(keyToEvict)
    }
  }

  clear() {
    this.cache.clear()
    this.keysInUse = []
  }

  has(key: K): boolean {
    return this.cache.has(key)
  }

  get size(): number {
    return this.cache.size
  }

  forEach(callback: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any) {
    this.cache.forEach(callback, thisArg)
  }

  keys() {
    return this.cache.keys()
  }

  values() {
    return this.cache.values()
  }

  entries() {
    return this.cache.entries()
  }

  [Symbol.iterator]() {
    return this.cache[Symbol.iterator]()
  }

  [Symbol.toStringTag] = 'CacheMap'

  toJSON = () => {
    return this.cache
  }
}

// export const CacheMap = Map
