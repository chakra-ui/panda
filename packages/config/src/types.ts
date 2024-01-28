import type { LoggerInterface } from '@pandacss/types'

export interface ConfigFileOptions {
  cwd: string
  file?: string
  logger: LoggerInterface
}
