import colors from 'kleur'
import { isMatch } from 'matcher'

export interface Config {
  level?: LogLevel
  filter?: string
  isDebug?: boolean
  onLog?: (entry: LogEntry) => void
}

export const createLogger = (conf: Config = {}) => {
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

    conf.onLog?.(entry)
  }

  const timing = (level: LogLevel) => (msg: string) => {
    const start = performance.now()
    return (_msg = msg) => {
      const end = performance.now()
      const ms = end - start
      stdout(level)('hrtime', `${_msg} ${colors.gray(`(${ms.toFixed(2)}ms)`)}`)
    }
  }

  return {
    get level() {
      return level
    },
    set level(newLevel: LogLevel) {
      level = newLevel
    },
    print(data: any) {
      console.dir(data, { depth: null, colors: true })
    },
    warn: stdout('warn'),
    info: stdout('info'),
    debug: stdout('debug'),
    error: stdout('error'),
    log: (data: string) => stdout(null)('', data),
    time: {
      info: timing('info'),
      debug: timing('debug'),
    },
    isDebug: Boolean(conf.isDebug),
  }
}

type LogLevel = keyof typeof logLevels
type LogEntry = {
  level: LogLevel | null
  msg: string
} & Record<string, any>

const matches = (filters: string[], value: string) => filters.some((search) => isMatch(value, search))
const createEntry = (level: LogLevel | null, type: string, data: any) => {
  const msg = data instanceof Error ? colors.red(data.stack ?? data.message) : data
  return { type, level, msg }
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
