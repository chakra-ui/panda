import { isMatch } from 'matcher'
import colors from 'kleur'
import util from 'util'

const omitKeys = ['level', 'type', 'time', 'pid']
function compact(obj: Entry) {
  const res = {}
  for (const key in obj) {
    if (!omitKeys.includes(key) && obj[key] != null) {
      res[key] = obj[key]
    }
  }
  return res
}

const levelsMap = {
  debug: { w: 0, c: colors.magenta },
  info: { w: 1, c: colors.blue },
  warn: { w: 2, c: colors.yellow },
  error: { w: 3, c: colors.red },
  fatal: { w: 4, c: colors.bgRed },
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

export type Config = {
  level?: LogLevel
  defaults?: any
  only?: string[]
  except?: string[]
}

type Entry = {
  type: string
  level: LogLevel
  time: Date
  pid: number
  msg: string
  err?: Error | string
  [key: string]: any
}

function matches(filters: string[], value: string) {
  return filters.some((search) => isMatch(value, search))
}

class Logger {
  level: LogLevel
  only: string[] = []
  except: string[] = []
  defaults: any
  parsers: any

  constructor(conf: Config = {}) {
    const debugEnv = process.env.DEBUG

    this.level = debugEnv ? 'debug' : conf.level || 'info'

    const only = conf.only ?? debugEnv

    if (only && only !== '*') {
      this.only = Array.isArray(only) ? only : only.split(/[\s,]+/)
    }

    if (conf.except) {
      this.except = conf.except
    }

    this.defaults = conf.defaults || {}
    this.parsers = { err: this.parseErr }
  }

  addParser(key: string, parser: (data: any) => any) {
    this.parsers[key] = parser
  }

  private getEntry(level: LogLevel, args: any[]): Entry {
    const data = typeof args[0] == 'object' ? args.shift() : {}
    let msg = util.format(...args)

    const pid = process.pid != 1 ? process.pid : null

    for (const key in this.parsers) {
      if (key in data) {
        Object.assign(data, this.parsers[key](data))
      }
    }

    msg = msg || data.msg
    return { level, ...data, msg, pid, time: new Date() }
  }

  output(entry: Entry) {
    entry.time.setMinutes(entry.time.getMinutes() - entry.time.getTimezoneOffset())

    const color = levelsMap[entry.level].c

    const data = compact(entry)
    const formatted = typeof entry.msg == 'string' ? entry.msg : util.inspect(data, { colors: true, depth: null })

    const uword = entry.type ? colors.gray(`[${entry.type}]`) : undefined
    const label = colors.bold(color(`${entry.level}`))

    const msg = [`🐼`, label, uword, formatted].filter(Boolean).join(' ')

    console.log(msg)
  }

  parseErr({ err }: { err: any }) {
    if (!(err instanceof Error)) err = new Error(err)
    const stack = err.stack.split(/[\r\n]+\s*/g)
    return {
      err: null,
      code: err.code,
      class: err.constructor.name,
      stack: stack.slice(1, -1),
      type: err.constructor.name,
      msg: colors.red(err.message),
    }
  }

  private log(level: LogLevel, ...args: any[]) {
    const baseEntry = this.getEntry(level, args)
    const entry = { ...this.defaults, ...baseEntry }

    const badLevel = levelsMap[this.level].w > levelsMap[level].w
    const badType = matches(this.except, entry.type) || (this.only.length > 0 && !matches(this.only, entry.type))

    if (badType || badLevel) return false

    this.output(entry)

    return entry
  }

  warn(...args: any[]) {
    return this.log('warn', ...args)
  }

  info(...args: any[]) {
    return this.log('info', ...args)
  }

  debug(...args: any[]) {
    return this.log('debug', ...args)
  }

  error(...args: any[]) {
    return this.log('error', ...args)
  }

  fatal(...args: any[]) {
    return this.log('fatal', ...args)
  }
}

export const logger = new Logger()

export { colors }
