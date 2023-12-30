import { evalConfig } from '@/src/lib/config/eval-config'
import { getImports } from '@/src/lib/config/get-imports'
import { Config } from '@pandacss/types'
import { useEffect, useRef, useState } from 'react'
import { useUpdateEffect } from 'usehooks-ts'

export const useConfig = (_config: string) => {
  const hasPresets = getImports(_config).length || evalConfig(_config)?.presets?.length

  const [config, setConfig] = useState<Config | null>(evalConfig(_config))
  const [error, setError] = useState<Error | null>(null)

  const [isLoading, setIsLoading] = useState(true)

  const compileWorkerRef = useRef<Worker>()

  useEffect(() => {
    compileWorkerRef.current = new Worker(new URL('../lib/config/compile.worker.ts', import.meta.url))

    if (hasPresets) compileWorkerRef.current?.postMessage(_config)
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
      compileWorkerRef.current?.postMessage(_config)
      setIsLoading(true)
    } else {
      const newConfig = evalConfig(_config)
      if (newConfig) setConfig(newConfig)
    }
  }, [_config])

  return { config, isLoading, error }
}

export type UseConfig = ReturnType<typeof useConfig>
