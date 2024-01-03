import { capitalize, createRegex, dashCase, mapObject, memo, uncapitalize } from '@pandacss/shared'
import type { TokenDictionary } from '@pandacss/token-dictionary'
import type { ArtifactFilters, Dict, PatternConfig, UserConfig } from '@pandacss/types'
import type { Utility } from './utility'

const helpers = { map: mapObject }

interface PatternOptions {
  config: UserConfig
  tokens: TokenDictionary
  utility: Utility
}

export class Patterns {
  patterns: Record<string, PatternConfig>
  details: PatternDetail[]
  private utility: Utility
  private tokens: TokenDictionary

  constructor(options: PatternOptions) {
    this.patterns = options.config.patterns ?? {}
    this.details = Object.entries(this.patterns).map(([name, pattern]) => this.createDetail(name, pattern))
    this.utility = options.utility
    this.tokens = options.tokens
  }

  private createDetail(name: string, pattern: PatternConfig): PatternDetail {
    const names = this.getNames(name)
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
  }

  get keys(): string[] {
    return Object.keys(this.patterns)
  }

  getConfig(name: string): PatternConfig {
    return this.patterns[name]
  }

  transform(name: string, data: Dict): Dict {
    return this.patterns[name]?.transform?.(data, helpers) ?? {}
  }

  getNames(name: string): PatternNames {
    const upperName = capitalize(name)
    return {
      upperName,
      baseName: name,
      dashName: dashCase(name),
      styleFnName: `get${upperName}Style`,
      jsxName: this.patterns[name]?.jsxName ?? upperName,
    }
  }

  find = memo((jsxName: string) => {
    return this.details.find((node) => node.match.test(jsxName))?.baseName ?? uncapitalize(jsxName)
  })

  filter = memo((jsxName: string): PatternDetail[] => {
    return this.details.filter((node) => node.match.test(jsxName))
  })

  isEmpty(): boolean {
    return this.keys.length === 0
  }

  saveOne(name: string, pattern: PatternConfig): void {
    this.patterns[name] = pattern
    const detailIndex = this.details.findIndex((detail) => detail.baseName === name)

    const updated = this.createDetail(name, pattern)
    if (detailIndex > -1) {
      // Replace the existing detail with the new detail
      this.details[detailIndex] = updated
    } else {
      // Add the new detail to the details array
      this.details.push(updated)
    }
  }

  remove(name: string) {
    delete this.patterns[name]
    const detailIndex = this.details.findIndex((detail) => detail.baseName === name)
    if (detailIndex > -1) {
      this.details.splice(detailIndex, 1)
    }
  }

  filterDetails(filters?: ArtifactFilters) {
    const patternDiffs = filters?.affecteds?.patterns
    return patternDiffs ? this.details.filter((pattern) => patternDiffs.includes(pattern.dashName)) : this.details
  }

  getPropertyValues = (patternName: string, property: string) => {
    const patternConfig = this.getConfig(patternName)
    if (!patternConfig) return []

    const propType = patternConfig.properties?.[property]
    if (!propType) return

    if (propType.type === 'enum') {
      return propType.value
    }

    if (propType.type === 'boolean') {
      return ['true', 'false']
    }

    if (propType.type === 'property') {
      return this.utility.getPropertyKeys(propType.value || property)
    }

    if (propType.type === 'token') {
      const values = this.tokens.getValue(propType.value)
      return Object.keys(values ?? {})
    }
  }
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
