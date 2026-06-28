import type { OutputSink } from './output'

export interface WatchLogOptions {
  dedupeKey?: string
}

export interface WatchLogger {
  log(message: string, options?: WatchLogOptions): void
  error(message: string): void
  reset(): void
}

export function createWatchLogger(output: OutputSink): WatchLogger {
  const seen = new Set<string>()

  const reset = () => {
    seen.clear()
  }

  return {
    log(message, options = {}) {
      const key = options.dedupeKey ?? message
      if (seen.has(key)) return

      seen.add(key)
      output.log(message)
    },
    error(message) {
      reset()
      output.error?.(message)
    },
    reset,
  }
}
