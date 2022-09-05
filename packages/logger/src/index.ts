import colors from 'picocolors'
import util from 'util'

const omitKeys = ['level', 'type', 'time', 'pid']
function compact(obj: any) {
  const res = {}
  for (const key in obj) {
    if (!omitKeys.includes(key) && obj[key] != null) {
      res[key] = obj[key]
    }
  }
  return res
}

const LEVELS = {
  debug: { w: 0, c: colors.blue },
  info: { w: 1, c: colors.green },
  warn: { w: 2, c: colors.yellow },
  error: { w: 3, c: colors.red },
  fatal: { w: 4, c: colors.red },
}

function output(entry: any) {
  const uword = entry.type == 'event' ? entry.level : entry.type
  entry.time.setMinutes(entry.time.getMinutes() - entry.time.getTimezoneOffset())

  const color = LEVELS[entry.level].c

  const data = compact(entry)
  const formatted = typeof entry.msg == 'string' ? entry.msg : util.inspect(data, { colors: true, depth: null })
  const msg = `🐼 ${colors.bold(color(`${entry.level.toUpperCase()}`))} [${uword}] ${formatted}`

  console.log('\n--------------------------------------------------------------\n')
  console.log(msg)
}

function parseErr({ err }: any) {
  if (!(err instanceof Error)) err = new Error(err)
  const stack = err.stack.split(/[\r\n]+\s*/g)
  return {
    err: null,
    code: err.code,
    class: err.constructor.name,
    message: err.message,
    stack: stack.slice(1, -1),
    msg: err.stack,
  }
}

function getEntry(this: Logger, level: LogLevel, args: any[]) {
  const data = typeof args[0] == 'object' ? args.shift() : {}
  let msg = util.format(...args)
  const type = data.type || 'event'

  const pid = process.pid != 1 ? process.pid : null

  for (const key in this.parsers) {
    if (key in data) {
      Object.assign(data, this.parsers[key](data))
    }
  }

  msg = msg || data.msg
  return { level, type, ...data, msg, pid, time: new Date() }
}

function log(this: Logger, level: LogLevel, ...args: any[]) {
  const entry = {
    ...this.defaults,
    ...getEntry.call(this, level, args),
  }

  const badLevel = LEVELS[this.level].w > LEVELS[level].w
  const badType = this.except.includes(entry.type) || (this.only.length > 0 && !this.only.includes(entry.type))
  if (badType || badLevel) return false

  output(entry)

  return entry
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

type Config = {
  level?: LogLevel
  defaults?: any
  only?: string[]
  except?: string[]
}

class Logger {
  level: LogLevel
  only: string[] = []
  except: string[] = []
  defaults: any
  parsers: any

  warn: (...args: any[]) => void
  info: (...args: any[]) => void
  debug: (...args: any[]) => void
  error: (...args: any[]) => void
  fatal: (...args: any[]) => void

  constructor(conf: Config = {}) {
    this.level = conf.level || 'debug'
    if (conf.only) {
      this.only = conf.only
    }
    if (conf.except) {
      this.except = conf.except
    }
    this.defaults = conf.defaults || {}
    this.parsers = { err: parseErr }

    const op = conf === false ? () => false : log

    this.warn = op.bind(this, 'warn')
    this.info = op.bind(this, 'info')
    this.debug = op.bind(this, 'debug')
    this.error = op.bind(this, 'error')
    this.fatal = op.bind(this, 'fatal')
  }

  addParser(key: string, parser: (data: any) => any) {
    this.parsers[key] = parser
  }
}

export const logger = new Logger()
