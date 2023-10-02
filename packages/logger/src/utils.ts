import { logLevels } from './levels'

export interface Config {
  level?: LogLevel
  filter?: string
  isDebug?: boolean
}

export type LogLevel = keyof typeof logLevels

export type Entry = {
  level: LogLevel | null
  msg: string
} & Record<string, any>
