import { useEffect, useState } from 'react'

export const useMatchMedia = (query: string) => {
  const [isMatch, setIsMatch] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const handler = (event: MediaQueryListEvent): void =>
      setIsMatch(event.matches)
    window.matchMedia(query).addEventListener('change', handler)
    return () => window.matchMedia(query).removeEventListener('change', handler)
  }, [query])

  return isMatch
}
