import { computed } from 'vue'

interface PersistentStorageOptions<T> {
  fallback: T
  parse: (raw: string | null) => T
  serialize?: (value: T) => string | null
}

export function usePersistentStorage<T>(
  key: string,
  { fallback, parse, serialize = String }: PersistentStorageOptions<T>,
) {
  const state = useState<T>(`storage:${key}`, () => fallback)

  const value = computed({
    get: () => state.value,
    set(next: T) {
      state.value = next
      try {
        const raw = serialize(next)
        if (raw === null) localStorage.removeItem(key)
        else localStorage.setItem(key, raw)
      } catch {
        // Storage can be blocked; keep the in-memory value.
      }
    },
  })

  function restore(): T {
    try {
      state.value = parse(localStorage.getItem(key))
    } catch {
      state.value = fallback
    }
    return state.value
  }

  return { value, restore }
}
