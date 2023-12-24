import { evalConfig } from '@/src/lib/compile-config/eval-config'
import { extractImports } from '@/src/lib/compile-config/extract-imports'
import { Config } from '@pandacss/types'
import { useEffect, useRef, useState } from 'react'

export const useConfig = (_config: string) => {
  const imports = extractImports(_config)
  const initialConfig = imports.length ? null : evalConfig(_config)

  const [config, setConfig] = useState<Config | null>(initialConfig)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const compileWorkerRef = useRef<Worker>()
  useEffect(() => {
    compileWorkerRef.current = new Worker(new URL('../lib/compile-config/compile-worker.ts', import.meta.url))
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
  }, [])

  useEffect(() => {
    setIsLoading(true)
    compileWorkerRef.current?.postMessage(_config)
  }, [_config])

  return { config, isLoading, error }
}
