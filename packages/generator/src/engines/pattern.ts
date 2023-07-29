import { capitalize, dashCase, mapObject, memo, uncapitalize } from '@pandacss/shared'
import type { Dict, UserConfig } from '@pandacss/types'

const helpers = { map: mapObject }

const createRegex = (item: Array<string | RegExp>) => {
  const regex = item.map((item) => (typeof item === 'string' ? item : item.source)).join('|')
  return new RegExp(`^${regex}$`)
}

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
    getConfig: (name: string) => patterns[name],
    transform: (name: string, data: Dict) => {
      return patterns[name]?.transform?.(data, helpers) ?? {}
    },
    getNames,
    details,
    getFnName: memo((jsxName: string) => {
      return details.find((node) => node.jsxName === jsxName)?.baseName ?? uncapitalize(jsxName)
    }),
    filter: memo((jsxName: string) => {
      return details.filter((node) => node.match.test(jsxName))
    }),
    isEmpty: () => Object.keys(patterns).length === 0,
  }
}
