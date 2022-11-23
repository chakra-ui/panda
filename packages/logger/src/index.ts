import boxen from 'boxen'
import colors from 'kleur'
import { isMatch } from 'matcher'
import util from 'util'

const omitKeys = ['level', 'type', 'time', 'pid']
function compact(obj: Entry) {
  const res: Record<string, any> = {}
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
  silent: { w: 4, c: colors.white },
}

export type LogLevel = keyof typeof levelsMap

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
    const debugEnv = process.env.PANDA_DEBUG

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

  private getEntry(level: LogLevel | null, args: any[]): Entry {
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

  format(entry: Entry) {
    entry.time.setMinutes(entry.time.getMinutes() - entry.time.getTimezoneOffset())

    const data = compact(entry)

    const formatted = typeof entry.msg == 'string' ? entry.msg : util.inspect(data, { colors: true, depth: null })
    const uword = entry.type ? colors.gray(`[${entry.type}]`) : undefined

    if (!entry.level) {
      return [uword, formatted].filter(Boolean).join(' ')
    }

    const color = levelsMap[entry.level].c
    const label = colors.bold(color(`${entry.level}`))

    const msg = [`🐼`, label, uword, formatted].filter(Boolean).join(' ')

    return msg
  }

  private parseErr({ err }: { err: any }) {
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

  private isValid(level: LogLevel, type: string) {
    const badLevel = levelsMap[this.level].w > levelsMap[level].w
    const badType = matches(this.except, type) || (this.only.length > 0 && !matches(this.only, type))
    return !(badType || badLevel)
  }

  private stdout(level: LogLevel, ...args: any[]) {
    const baseEntry = this.getEntry(level, args)
    const entry = { ...this.defaults, ...baseEntry }

    const valid = this.isValid(level, entry.type)
    if (!valid) return false

    const msg = this.format(entry)
    console.log(msg)

    return entry
  }

  warn(...args: any[]) {
    return this.stdout('warn', ...args)
  }

  info(...args: any[]) {
    return this.stdout('info', ...args)
  }

  debug(...args: any[]) {
    return this.stdout('debug', ...args)
  }

  error(...args: any[]) {
    return this.stdout('error', ...args)
  }

  log(...args: any[]) {
    const entry = this.getEntry(null, args)
    if (this.level === 'silent') return
    console.log(this.format(entry))
  }

  get time() {
    const base = (level: LogLevel, msg: string, ...args: any[]) => {
      const str = `${msg} ${args.join(' ')}`
      const start = process.hrtime()
      return () => {
        const end = process.hrtime(start)
        const ms = end[0] * 1e3 + end[1] * 1e-6
        this.stdout(level, { type: 'hrtime', msg: `${str} ${colors.gray(`(${ms.toFixed(2)}ms)`)}` })
      }
    }

    return {
      info: (msg: string, ...args: any[]) => base('info', msg, ...args),
      debug: (msg: string, ...args: any[]) => base('debug', msg, ...args),
    }
  }

  box(content: string, title?: string) {
    return boxen(content, {
      padding: { left: 3, right: 3, top: 1, bottom: 1 },
      borderColor: 'magenta',
      borderStyle: 'round',
      title,
      titleAlignment: 'center',
    })
  }
}

export const logger = new Logger()

export function quote(...str: string[]) {
  return colors.cyan(`\`${str.join('')}\``)
}

export { colors }
