import { Config } from '@pandacss/types'
import { useEffect, useRef, useState } from 'react'

export const useConfig = (_config: string) => {
  const [config, setConfig] = useState<Config | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const compileWorkerRef = useRef<Worker>()
  useEffect(() => {
    compileWorkerRef.current = new Worker(new URL('../lib/compile-config/compile-worker.ts', import.meta.url))
    compileWorkerRef.current.onmessage = (event: MessageEvent<{ config: string }>) => {
      const newConfig = JSON.parse(event.data.config)
      if (newConfig) setConfig(newConfig)
      setIsLoading(true)
    }

    return () => {
      compileWorkerRef.current?.terminate()
    }
  }, [])

  useEffect(() => {
    compileWorkerRef.current?.postMessage(_config)
  }, [_config])

  return { config, isLoading }
}
