import colors from 'kleur'
import { match, Obj, pipe, when } from 'lil-fp'
import { isMatch } from 'matcher'
import { createEntry, formatEntry } from './format-entry'
import { logLevels } from './levels'
import { type Config, type LogLevel } from './utils'

const matches = (filters: string[], value: string) => filters.some((search) => isMatch(value, search))

export const createLogger = (conf: Config = {}) => {
  let level: LogLevel = conf.level ?? 'info'

  const { stdout, timing } = pipe(
    conf,

    ({ filter }) => ({
      getLevel: () => (filter ? 'debug' : level),
      filter: filter !== '*' ? filter?.split(/[\s,]+/) ?? [] : [],
    }),

    Obj.assignTo('config'),

    Obj.assign(({ config }) => ({
      isValid(level: LogLevel, type: string) {
        const badLevel = logLevels[config.getLevel()].weight > logLevels[level].weight
        const badType = config.filter.length > 0 && !matches(config.filter, type)
        return !(badType || badLevel)
      },
    })),

    Obj.assign(({ isValid, config }) => ({
      stdout(level: LogLevel | null) {
        return (type: string, data: any) => {
          pipe(
            createEntry(level, type, data),
            match(
              when(
                ({ level, type }) => level != null && isValid(level, type),
                (entry) => {
                  const { msg, label } = formatEntry(entry) ?? {}
                  console.log(label, msg)
                },
              ),
              when(
                ({ level }) => config.getLevel() !== 'silent' && level == null,
                () => {
                  console.log(...[type, data].filter(Boolean))
                },
              ),
            ),
          )
        }
      },
    })),

    Obj.assign(({ stdout }) => ({
      timing: (level: LogLevel) => (msg: string) => {
        const start = performance.now()
        return () => {
          const end = performance.now()
          const ms = end - start
          stdout(level)('hrtime', `${msg} ${colors.gray(`(${ms.toFixed(2)}ms)`)}`)
        }
      },
    })),
  )

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
