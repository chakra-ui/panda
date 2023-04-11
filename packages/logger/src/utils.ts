import { logLevels } from './levels'

export type Config = {
  level?: LogLevel
  filter?: string
}

export type LogLevel = keyof typeof logLevels

export type Entry = {
  level: LogLevel | null
  msg: string
} & Record<string, any>
