import { useCallback, useMemo, useSyncExternalStore } from 'react'

/**
 * Subscribes to a media query. One MediaQueryList instance is reused for both
 * subscribe and unsubscribe, and the server snapshot is always `false`, so the
 * first client render matches the markup.
 */
export const useMatchMedia = (query: string) => {
  const mql = useMemo(
    () => (typeof window === 'undefined' ? null : window.matchMedia(query)),
    [query]
  )

  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!mql) return () => {}
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    [mql]
  )

  return useSyncExternalStore(
    subscribe,
    () => mql?.matches ?? false,
    () => false
  )
}
