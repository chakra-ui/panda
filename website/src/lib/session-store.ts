'use client'

type Callback = VoidFunction

export class SessionStore<T = Record<string, any>> {
  private storageKey: string
  private callbacks: Callback[] = []

  constructor(storageKey: string) {
    this.storageKey = storageKey
  }

  private publish = () => {
    for (const callback of this.callbacks) {
      callback()
    }
  }

  private getStorageValue = (): string | null => {
    if (typeof window === 'undefined') return null
    return sessionStorage.getItem(this.storageKey)
  }

  private parse = (value: string | null | undefined): T => {
    let data = {} as T
    try {
      if (value) data = JSON.parse(value)
    } catch {}
    return data
  }

  getValue = (key: string): string | undefined => {
    const storage = this.parse(this.getStorageValue())
    return storage[key]
  }

  setValue = (key: string, value: string | null) => {
    const storageObj = this.parse(this.getStorageValue())
    const newStorage = JSON.stringify({ ...storageObj, [key]: value })
    sessionStorage.setItem(this.storageKey, newStorage)
    this.publish()
  }

  subscribe = (callback: Callback): (() => void) => {
    const handler = (e: StorageEvent) => {
      if (e.storageArea === sessionStorage && e.key === this.storageKey) {
        callback()
      }
    }

    window.addEventListener('storage', handler)
    this.callbacks = [...this.callbacks, callback]

    return () => {
      window.removeEventListener('storage', handler)
      this.callbacks = this.callbacks.filter(c => c !== callback)
    }
  }

  getSnapshot = (): string | null => {
    return this.getStorageValue()
  }

  getServerSnapshot = (): undefined => {
    return undefined
  }

  getParsedSnapshot = (): T => {
    return this.parse(this.getSnapshot())
  }
}
