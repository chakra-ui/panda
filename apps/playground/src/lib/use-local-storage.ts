import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react'

const SYNC_EVENT = 'playground:local-storage'

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw == null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

/** JSON-backed `localStorage` state, kept in sync across hook instances and tabs. */
export function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => read(key, initialValue))

  const set: Dispatch<SetStateAction<T>> = useCallback(
    (action) => {
      const next = action instanceof Function ? action(read(key, initialValue)) : action
      try {
        window.localStorage.setItem(key, JSON.stringify(next))
      } catch {
        // storage can be unavailable (private mode, quota); keep in-memory state
      }
      setValue(next)
      window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: key }))
    },
    [key, initialValue],
  )

  useEffect(() => {
    const sync = (event: Event) => {
      const changed = event instanceof StorageEvent ? event.key : (event as CustomEvent<string>).detail
      if (changed == null || changed === key) setValue(read(key, initialValue))
    }
    window.addEventListener('storage', sync)
    window.addEventListener(SYNC_EVENT, sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener(SYNC_EVENT, sync)
    }
  }, [key, initialValue])

  return [value, set]
}
