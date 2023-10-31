import { capitalize, dashCase, mapObject, memo, createRegex, uncapitalize } from '@pandacss/shared'
import type { Dict, PatternConfig, UserConfig } from '@pandacss/types'

const helpers = { map: mapObject }

export const getPatternEngine = (config: UserConfig): PandaPatternEngine => {
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

export interface PandaPatternEngine {
  keys: string[]
  getConfig: (name: string) => PatternConfig
  transform: (name: string, data: Dict) => Dict
  getNames: (name: string) => PatternNames
  details: PatternDetail[]
  find: (jsxName: string) => PatternDetail | undefined
  getFnName: (jsxName: string) => string
  filter: (jsxName: string) => PatternDetail[]
  isEmpty: () => boolean
}

interface PatternNames {
  upperName: string
  baseName: string
  dashName: string
  styleFnName: string
  jsxName: string
}

export interface PatternDetail extends PatternNames {
  props: string[]
  blocklistType: string
  config: PatternConfig
  type: 'pattern'
  match: RegExp
  jsx: NonNullable<PatternConfig['jsx']>
}
