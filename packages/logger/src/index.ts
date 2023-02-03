import boxen from 'boxen'
import colors from 'kleur'
import { match, Obj, otherwise, pipe, when } from 'lil-fp'
import { isMatch } from 'matcher'

const logLevels = {
  debug: { weight: 0, color: colors.magenta },
  info: { weight: 1, color: colors.blue },
  warn: { weight: 2, color: colors.yellow },
  error: { weight: 3, color: colors.red },
  silent: { weight: 4, color: colors.white },
}

export type LogLevel = keyof typeof logLevels

const createEntry = (level: LogLevel | null, type: string, data: any) => {
  const msg = data instanceof Error ? colors.red(data.message) : data
  return { type, level, msg }
}

const formatEntry = (entry: Record<string, any>) =>
  pipe(
    { entry },
    Obj.assign(({ entry }) => ({
      uword: entry.type ? colors.gray(`[${entry.type}]`) : '',
    })),
    match(
      when(
        ({ entry }) => entry.level != null,
        ({ entry, uword }) => {
          const { msg, level } = entry
          const color = logLevels[level].color
          const label = colors.bold(color(`${level}`))
          return { label: [`🐼`, label, uword].filter(Boolean).join(' '), msg }
        },
      ),
      otherwise(({ entry, uword }) => {
        const { msg } = entry
        return { label: uword ?? '', msg }
      }),
    ),
  )

const box = (content: string, title?: string) =>
  boxen(content, {
    padding: { left: 3, right: 3, top: 1, bottom: 1 },
    borderColor: 'magenta',
    borderStyle: 'round',
    title,
    titleAlignment: 'center',
  })

export const quote = (...str: string[]) => colors.cyan(`\`${str.join('')}\``)

export type Config = {
  level?: LogLevel
  filter?: string
}

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
    box,
    warn: stdout('warn'),
    info: stdout('info'),
    debug: stdout('debug'),
    error: stdout('error'),
    log: (data: string) => stdout(null)('', data),
    time: {
      info: timing('info'),
      debug: timing('debug'),
    },
  }
}

export const logger = createLogger({
  filter: typeof process !== 'undefined' ? process.env.PANDA_DEBUG : undefined,
})

export { colors }
