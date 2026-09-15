import { compile } from '@/src/lib/config/compile'
import { getConfigError, validateConfig } from '@/src/lib/config/eval-config'
import { getImports } from '@/src/lib/config/get-imports'
import { useDebounceValue } from '@/src/lib/use-debounce-value'
import type { Config } from '@pandacss/types'
import { useEffect, useRef, useState } from 'react'

// Resolved on the main thread: a worker boundary would JSON-serialize the config
// and strip function-valued utility `values` / `transform` from presets.
export const useConfig = (configStr: string) => {
  const hasPresets = getImports(configStr).length || validateConfig(configStr)?.presets?.length

  const [config, setConfig] = useState<Config | null>(() => (hasPresets ? null : validateConfig(configStr)))
  const [error, setError] = useState<Error | null>(() => (hasPresets ? null : getConfigError(configStr)))

  const [_isLoading, setIsLoading] = useState(true)
  const isLoading = useDebounceValue(_isLoading, 500)

  const requestRef = useRef(0)

  useEffect(() => {
    const request = ++requestRef.current
    setIsLoading(true)

    compile(configStr)
      .then((newConfig) => {
        if (request !== requestRef.current) return
        if (newConfig) setConfig(newConfig)
        setError(null)
      })
      .catch((error) => {
        if (request !== requestRef.current) return
        setError(error as Error)
      })
      .finally(() => {
        if (request === requestRef.current) setIsLoading(false)
      })
  }, [configStr])

  return { config, isLoading, error }
}

export type UseConfig = ReturnType<typeof useConfig>
