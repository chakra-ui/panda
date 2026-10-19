import { useEffect, useRef, type DependencyList, type EffectCallback } from 'react'

/** `useEffect` that skips the initial mount run. */
export function useUpdateEffect(effect: EffectCallback, deps: DependencyList) {
  const isFirst = useRef(true)

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false
      return
    }
    return effect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
