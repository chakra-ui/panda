import { evalConfig, validateConfig, getConfigError } from '@/src/lib/config/eval-config'
import { getImports } from '@/src/lib/config/get-imports'
import { Config } from '@pandacss/types'
import { useEffect, useRef, useState } from 'react'
import { useDebounce, useUpdateEffect } from 'usehooks-ts'

export const useConfig = (configStr: string) => {
  const hasPresets = getImports(configStr).length || validateConfig(configStr)?.presets?.length

  const initialConfig = hasPresets ? null : validateConfig(configStr)
  const [config, setConfig] = useState<Config | null>(initialConfig)

  const initialError = hasPresets ? null : getConfigError(configStr)
  const [error, setError] = useState<Error | null>(initialError)

  const [_isLoading, setIsLoading] = useState(true)
  const isLoading = useDebounce(_isLoading, 500)

  const compileWorkerRef = useRef<Worker>()

  useEffect(() => {
    compileWorkerRef.current = new Worker(new URL('../lib/config/compile.worker.ts', import.meta.url))
    if (hasPresets) compileWorkerRef.current?.postMessage(configStr)
    else {
      setIsLoading(false)
    }

    compileWorkerRef.current.onmessage = (event: MessageEvent<{ config: string; error: any }>) => {
      setIsLoading(false)
      if (event.data.error) {
        return setError(event.data.error)
      }
      const newConfig = JSON.parse(event.data.config)
      if (newConfig) setConfig(newConfig)
      setError(null)
    }

    return () => {
      compileWorkerRef.current?.terminate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useUpdateEffect(() => {
    if (hasPresets) {
      compileWorkerRef.current?.postMessage(configStr)
      setIsLoading(true)
    } else {
      try {
        const newConfig = evalConfig(configStr)
        if (newConfig) setConfig(newConfig)
        setError(null)
      } catch (error) {
        setError(error as Error)
      }
    }
  }, [configStr])

  return { config, isLoading, error }
}

export type UseConfig = ReturnType<typeof useConfig>
