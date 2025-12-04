import {
  capitalize,
  createRegex,
  dashCase,
  getPatternStyles,
  isObject,
  memo,
  uncapitalize,
  unionType,
} from '@pandacss/shared'
import type { TokenDictionary } from '@pandacss/token-dictionary'
import type { ArtifactFilters, Dict, PatternConfig, PatternHelpers, PatternProperty, UserConfig } from '@pandacss/types'
import type { Utility } from './utility'

interface PatternOptions {
  config: UserConfig
  tokens: TokenDictionary
  utility: Utility
  helpers: PatternHelpers
}

export class Patterns {
  patterns: Record<string, PatternConfig>
  details: PatternNode[]
  keys: string[]
  private utility: Utility
  private tokens: TokenDictionary
  private deprecated: Set<string> = new Set()

  constructor(private options: PatternOptions) {
    this.patterns = options.config.patterns ?? {}
    this.details = Object.entries(this.patterns).map(([name, pattern]) => this.createDetail(name, pattern))
    this.keys = Object.keys(this.patterns)
    this.utility = options.utility
    this.tokens = options.tokens
  }

  private createDetail(name: string, pattern: PatternConfig): PatternNode {
    const names = this.getNames(name)
    const jsx = (pattern.jsx ?? []).concat([names.jsxName])

    if (pattern.deprecated) {
      this.deprecated.add(name)
    }

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

  getConfig(name: string): PatternConfig {
    return this.patterns[name]
  }

  transform(name: string, styles: Dict): Dict {
    const pattern = this.patterns[name]
    const _styles = getPatternStyles(pattern, styles)
    return pattern?.transform?.(_styles, this.options.helpers) ?? {}
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

  filter = memo((jsxName: string): PatternNode[] => {
    return this.details.filter((node) => node.match.test(jsxName))
  })

  isEmpty(): boolean {
    return this.keys.length === 0
  }

  isDeprecated(name: string): boolean {
    return this.deprecated.has(name)
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
      const values = this.tokens.view.getCategoryValues(propType.value)
      return Object.keys(values ?? {})
    }
  }

  getPropertyType = (prop: PatternProperty): string => {
    switch (prop.type) {
      case 'enum':
        // TypeScript union style for enums: "a" | "b" | "c"
        return unionType(prop.value)

      case 'token': {
        // Token reference with optional CSS property fallback
        const tokenType = `Tokens["${prop.value}"]`
        if (prop.property) {
          return `ConditionalValue<${tokenType} | Properties["${prop.property}"]>`
        }
        return `ConditionalValue<${tokenType}>`
      }

      case 'property':
        // System property type
        return `SystemProperties["${prop.value}"]`

      case 'string':
      case 'number':
      case 'boolean':
        // Primitive types with ConditionalValue wrapper
        return `ConditionalValue<${prop.type}>`

      default:
        // For any other type, return ConditionalValue wrapper
        return `ConditionalValue<${(prop as any).type || 'unknown'}>`
    }
  }

  static isValidNode = (node: unknown): node is PatternNode => {
    return isObject(node) && 'type' in node && node.type === 'recipe'
  }
}

interface PatternNames {
  upperName: string
  baseName: string
  dashName: string
  styleFnName: string
  jsxName: string
}

export interface PatternNode extends PatternNames {
  props: string[]
  blocklistType: string
  config: PatternConfig
  type: 'pattern'
  match: RegExp
  jsx: NonNullable<PatternConfig['jsx']>
}
