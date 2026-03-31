export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent'

export interface LogEntry {
  level: LogLevel | null
  msg: string
  [key: string]: any
}

export interface LoggerInterface {
  level: 'debug' | 'info' | 'warn' | 'error' | 'silent'
  print(data: any): void
  onLog?: (entry: LogEntry) => void
  warn: (type: string, data: any) => void
  info: (type: string, data: any) => void
  debug: (type: string, data: any) => void
  error: (type: string, data: any) => void
  /**
   * Log a caught error with context. Extracts the message for the error level,
   * and logs the full stack at debug level.
   */
  caughtError: (type: string, context: string, error: unknown) => void
  log: (data: string) => void
  time: {
    info: (msg: string) => (_msg?: string) => void
    debug: (msg: string) => (_msg?: string) => void
  }
  isDebug: boolean
}
