import type { LogEntry, LogLevel, LoggerInterface } from '@pandacss/types'
import colors from 'kleur'
import { isMatch } from 'matcher'

export interface LoggerConfig {
  level?: LogLevel
  filter?: string
  isDebug?: boolean
  onLog?: (entry: LogEntry) => void
}

export const createLogger = (conf: LoggerConfig = {}): LoggerInterface => {
  let onLog = conf.onLog
  let level: LogLevel = conf.isDebug ? 'debug' : conf.level ?? 'info'

  const filter = conf.filter !== '*' ? conf.filter?.split(/[\s,]+/) ?? [] : []

  const getLevel = () => (filter.length ? 'debug' : level)

  const isValid = (level: LogLevel, type: string) => {
    const badLevel = logLevels[getLevel()].weight > logLevels[level].weight
    const badType = filter.length > 0 && !matches(filter, type)
    return !(badType || badLevel)
  }

  const stdout = (level: LogLevel | null) => (type: string, data: any) => {
    const entry = createEntry(level, type, data)

    if (level != null && isValid(level, type)) {
      const logEntry = formatEntry(entry) ?? {}
      console.log(logEntry.label, logEntry.msg)
    } else if (getLevel() !== 'silent' && level == null) {
      console.log(...[type, data].filter(Boolean))
    }

    onLog?.(entry)
  }

  const logFns = {
    debug: stdout('debug'),
    info: stdout('info'),
    warn: stdout('warn'),
    error: stdout('error'),
  } as const

  const timing = (level: 'info' | 'debug') => (msg: string) => {
    const start = performance.now()
    return (_msg = msg) => {
      const end = performance.now()
      const ms = end - start
      logFns[level]('hrtime', `${_msg} ${colors.gray(`(${ms.toFixed(2)}ms)`)}`)
    }
  }

  return {
    get level() {
      return level
    },
    set level(newLevel: LogLevel) {
      level = newLevel
    },
    set onLog(fn: (entry: LogEntry) => void) {
      onLog = fn
    },
    ...logFns,
    print(data: any) {
      console.dir(data, { depth: null, colors: true })
    },
    log: (data: string) => stdout(null)('', data),
    time: {
      info: timing('info'),
      debug: timing('debug'),
    },
    isDebug: Boolean(conf.isDebug),
  }
}

const matches = (filters: string[], value: string) => filters.some((search) => isMatch(value, search))

const createEntry = (level: LogLevel | null, type: string, data: any) => {
  const msg = data instanceof Error ? colors.red(data.stack ?? data.message) : data
  const timestamp = new Date().toISOString()
  return { t: timestamp, type, level, msg }
}

interface FormatedEntry {
  label: string
  msg: string
}

const formatEntry = (entry: LogEntry): FormatedEntry => {
  const uword = entry.type ? colors.gray(`[${entry.type}]`) : ''
  let label = ''
  let msg = ''

  if (entry.level != null) {
    const { msg: message, level } = entry
    const color = logLevels[level!].color
    const levelLabel = colors.bold(color(`${level}`))
    label = [`🐼`, levelLabel, uword].filter(Boolean).join(' ')
    msg = message
  } else {
    label = uword ?? ''
    msg = entry.msg
  }

  return { label, msg }
}

const logLevels = {
  debug: { weight: 0, color: colors.magenta },
  info: { weight: 1, color: colors.blue },
  warn: { weight: 2, color: colors.yellow },
  error: { weight: 3, color: colors.red },
  silent: { weight: 4, color: colors.white },
}
