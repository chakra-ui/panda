import { capitalize, dashCase, mapObject, memo, createRegex, uncapitalize } from '@pandacss/shared'
import type { Dict, UserConfig } from '@pandacss/types'

const helpers = { map: mapObject }

export const getPatternEngine = (config: UserConfig) => {
  const patterns = config.patterns ?? {}
  const getNames = (name: string) => {
    const upperName = capitalize(name)
    return {
      upperName,
      baseName: name,
      dashName: dashCase(name),
      styleFnName: `get${upperName}Style`,
      jsxName: patterns[name]?.jsxName ?? upperName,
    }
  }
  const details = Object.entries(patterns).map(([name, pattern]) => {
    const names = getNames(name)
    const jsx = (pattern.jsx ?? []).concat([names.jsxName])

    return {
      ...names,
      props: Object.keys(pattern?.properties ?? {}),
      blocklistType: pattern?.blocklist ? `| '${pattern.blocklist.join("' | '")}'` : '',
      config: pattern,
      type: 'pattern' as const,
      match: createRegex(jsx),
      jsx,
    }
  })

  return {
    keys: Object.keys(patterns),
    getConfig: (name: string) => patterns[name],
    transform: (name: string, data: Dict) => {
      return patterns[name]?.transform?.(data, helpers) ?? {}
    },
    getNames,
    details,
    find: memo((jsxName: string) => {
      return details.find((node) => node.match.test(jsxName))
    }),
    getFnName(jsxName: string) {
      return this.find(jsxName)?.baseName ?? uncapitalize(jsxName)
    },
    filter: memo((jsxName: string) => {
      return details.filter((node) => node.match.test(jsxName))
    }),
    isEmpty: () => Object.keys(patterns).length === 0,
  }
}
