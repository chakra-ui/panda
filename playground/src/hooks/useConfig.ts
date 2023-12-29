import { useEffect, useRef, useState } from 'react'
import { PlaygroundConfig, evalConfig } from '@/src/lib/config/eval-config'
import { useUpdateEffect } from 'usehooks-ts'
import { extractImports } from '@/src/lib/config/extract-imports'

export const useConfig = (_config: string) => {
  const hasPresets = extractImports(_config).length || evalConfig(_config)?.presets?.length
  const defaultConfig = hasPresets ? null : evalConfig(_config)
  const [config, setConfig] = useState<PlaygroundConfig | null>(defaultConfig)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const compileWorkerRef = useRef<Worker>()

  useEffect(() => {
    compileWorkerRef.current = new Worker(new URL('../lib/config/compile.worker.ts', import.meta.url))

    compileWorkerRef.current?.postMessage(_config)

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
    setIsLoading(true)
    compileWorkerRef.current?.postMessage(_config)
  }, [_config])

  return { config, isLoading, error }
}

export type UseConfig = ReturnType<typeof useConfig>
