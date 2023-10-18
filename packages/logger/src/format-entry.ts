import colors from 'kleur'
import { match, Obj, otherwise, pipe, when } from 'lil-fp'
import { type Entry, type LogLevel } from './utils'
import { logLevels } from './levels'

export const formatEntry = (entry: Entry) =>
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
          const color = logLevels[level!].color
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

export const createEntry = (level: LogLevel | null, type: string, data: any) => {
  const msg = data instanceof Error ? colors.red(data.stack ?? data.message) : data
  return { type, level, msg }
}
