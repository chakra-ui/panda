import { capitalize, dashCase, mapObject } from '@pandacss/shared'
import type { LoadConfigResult } from '@pandacss/types'
import { Obj, pipe } from 'lil-fp'

export const pattern = ({ config }: LoadConfigResult) => {
  return pipe(
    { patterns: config.patterns ?? {}, helpers: { map: mapObject } },

    Obj.bind('getConfig', ({ patterns }) => {
      return (name: string) => patterns[name]
    }),

    Obj.bind('exec', ({ getConfig, helpers }) => {
      return (name: string, data: Record<string, any>) => {
        return getConfig(name)?.transform?.(data, helpers)
      }
    }),

    Obj.bind('getNames', ({ getConfig }) => (name: string) => {
      const upperName = capitalize(name)
      return {
        name,
        upperName,
        dashName: dashCase(name),
        styleFn: `get${upperName}Style`,
        jsxName: getConfig(name)?.jsx ?? upperName,
      }
    }),

    Obj.bind('details', ({ getNames, patterns }) => {
      return Object.entries(patterns).map(([name, pattern]) => ({
        ...getNames(name),
        props: Object.keys(pattern?.properties ?? {}),
        blocklistType: pattern?.blocklist ? `| '${pattern.blocklist.join("' | '")}'` : '',
        config: pattern,
      }))
    }),

    Obj.bind('nodes', ({ patterns }) => {
      return Object.entries(patterns).map(([name, pattern]) => ({
        type: 'pattern' as const,
        name: pattern.jsx ?? capitalize(name),
        props: Object.keys(pattern.properties),
        baseName: name,
      }))
    }),

    Obj.bind('isEmpty', ({ patterns }) => Object.keys(patterns).length > 0),
  )
}
