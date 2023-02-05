import { capitalize, dashCase, mapObject, uncapitalize } from '@pandacss/shared'
import type { UserConfig } from '@pandacss/types'
import { Obj, pipe } from 'lil-fp'

const helpers = { map: mapObject }

export const getPatternEngine = (config: UserConfig) => {
  return pipe(
    { patterns: config.patterns ?? {} },

    Obj.bind('getConfig', ({ patterns }) => {
      return (name: string) => patterns[name]
    }),

    Obj.bind('transform', ({ getConfig }) => {
      return (name: string, data: Record<string, any>) => {
        return getConfig(name)?.transform?.(data, helpers) ?? {}
      }
    }),

    Obj.bind('getNames', ({ getConfig }) => (name: string) => {
      const upperName = capitalize(name)
      return {
        name,
        upperName,
        dashName: dashCase(name),
        styleFnName: `get${upperName}Style`,
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

    Obj.bind('getFnName', ({ nodes }) => (jsx: string) => {
      return nodes.find((node) => node.name === jsx)?.baseName ?? uncapitalize(jsx)
    }),

    Obj.bind('isEmpty', ({ patterns }) => {
      return () => Object.keys(patterns).length > 0
    }),
  )
}
