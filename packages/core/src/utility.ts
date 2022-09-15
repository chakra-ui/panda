import { logger, quote } from '@css-panda/logger'
import { isFunction, isString } from '@css-panda/shared'
import type { TokenMap } from '@css-panda/tokens'
import type { AnyFunction, Dict, PropertyConfig, UtilityConfig } from '@css-panda/types'

const clean = (v: string) => v.toString().replaceAll(' ', '_')

type Options = {
  config?: UtilityConfig
  tokens: TokenMap
}

export class Utility {
  tokenMap: TokenMap
  classNameMap: Map<string, string> = new Map()
  stylesMap: Map<string, Dict> = new Map()
  valuesMap: Map<string, Set<string>> = new Map()
  config: UtilityConfig = { properties: {} }
  report: Map<string, string> = new Map()

  private transformMap: Map<string, AnyFunction> = new Map()
  private propertyConfigMap: Map<string, PropertyConfig> = new Map()

  constructor(options: Options) {
    const { tokens, config } = options
    this.tokenMap = tokens

    if (config) {
      this.config = config
      this.assignProperties()
      this.assignValueMap()
    }
  }

  private getPropKey(prop: string, value: string) {
    return `(${prop} = ${value})`
  }

  private hash(prop: string, value: string) {
    return `${prop}_${value}`
  }

  private getPropertyValues(config: PropertyConfig) {
    const { values } = config

    if (isString(values)) {
      const result = this.tokenMap.flattenedTokens.get(values)

      if (!result) {
        logger.warn(`Token ${quote(values)} not found in ${quote('config.tokens')}`)
        return {}
      }

      return result
    }

    if (Array.isArray(values)) {
      return values.reduce<Dict<string>>((acc, v) => {
        acc[v] = v
        return acc
      }, {})
    }

    if (isFunction(values)) {
      return values((path) => this.tokenMap.query(path))
    }

    return values
  }

  normalize(value: string | PropertyConfig | undefined): PropertyConfig | undefined {
    return typeof value === 'string' ? { className: value } : value
  }

  private assignProperties() {
    for (const [property, propertyConfig] of Object.entries(this.config.properties)) {
      const propConfig = this.normalize(propertyConfig)

      this.setTransform(property, propConfig?.transform)

      if (!propConfig) continue
      this.propertyConfigMap.set(property, propConfig)

      const values = this.getPropertyValues(propConfig)
      if (!values) continue

      for (const [alias, raw] of Object.entries(values)) {
        const propKey = this.getPropKey(property, alias)
        this.setStyles(property, raw, propKey)
        this.setClassName(property, alias)
      }
    }
  }

  private assignValueMap() {
    for (const [property, propertyConfig] of Object.entries(this.config.properties)) {
      const propConfig = this.normalize(propertyConfig)

      if (!propConfig) continue

      const values = this.getPropertyValues(propConfig)

      if (typeof values === 'object' && values.type) {
        this.valuesMap.set(property, new Set([`type:${values.type}`]))
        continue
      }

      if (values) {
        this.valuesMap.set(property, new Set(Object.keys(values)))
      }

      const set = this.valuesMap.get(property) ?? new Set()

      if (propConfig.cssType) {
        this.valuesMap.set(property, set.add(`CSSProperties["${propConfig.cssType}"]`))
        continue
      }
    }

    for (const [shorthand, longhand] of Object.entries(this.config.shorthands || {})) {
      this.valuesMap.set(shorthand, this.valuesMap.get(longhand)!)
    }
  }

  get valueTypes() {
    const map = new Map<string, string[]>()
    for (const [prop, tokens] of this.valuesMap.entries()) {
      // When tokens does not exist in the config
      if (tokens.size === 0) {
        map.set(prop, ['string'])
        continue
      }

      map.set(
        prop,
        Array.from(tokens).map((key) => {
          if (key.startsWith('CSSProperties')) return key
          if (key.startsWith('type:')) return key.replace('type:', '')
          return JSON.stringify(key)
        }),
      )
    }
    return map
  }

  defaultTransform = (value: string, prop: string) => {
    const isCssVariable = prop.startsWith('--')
    if (isCssVariable) {
      const tokenValue = this.tokenMap.values.get(value)?.varRef
      value = typeof tokenValue === 'string' ? tokenValue : value
    }
    return { [prop]: value }
  }

  private setTransform(property: string, transform?: AnyFunction) {
    const defaultTransform = (value: string) => this.defaultTransform(value, property)
    const transformFn = transform ?? defaultTransform
    this.transformMap.set(property, transformFn)
    return this
  }

  private setStyles(property: string, raw: string, propKey?: string) {
    propKey = propKey ?? this.getPropKey(property, raw)
    const defaultTransform = (value: string) => this.defaultTransform(value, property)
    const getStyles = this.transformMap.get(property) ?? defaultTransform
    this.stylesMap.set(propKey, getStyles(raw))
    return this
  }

  private setClassName(property: string, raw: string) {
    const propKey = this.getPropKey(property, raw)
    const config = this.propertyConfigMap.get(property)

    if (!config) {
      this.classNameMap.set(propKey, this.hash(property, raw))
      return this
    }

    const resolvedClassName = isString(config.className)
      ? this.hash(config.className, raw)
      : config.className(raw, property)

    this.classNameMap.set(propKey, resolvedClassName)

    return this
  }

  private isShorthand(prop: string) {
    return !!this.config.shorthands?.[prop]
  }

  private isProperty(prop: string) {
    return this.propertyConfigMap.has(prop)
  }

  private resolveShorthand(prop: string) {
    const longhand = this.config.shorthands![prop]
    if (!this.config.properties[longhand]) {
      throw new Error(`Property '${longhand}' not found in config`)
    }
    return longhand
  }

  private getOrCreateClassName(prop: string, value: string) {
    const inner = (prop: string, value: string) => {
      const propKey = this.getPropKey(prop, value)
      if (!this.classNameMap.has(propKey)) {
        if (this.isProperty(prop)) {
          this.report.set(prop, value)
        }
        this.setClassName(prop, value)
      }
      return this.classNameMap.get(propKey)!
    }

    return this.isShorthand(prop) ? inner(this.resolveShorthand(prop), value) : inner(prop, value)
  }

  private getOrCreateStyle(prop: string, value: string) {
    const inner = (prop: string, value: string) => {
      const propKey = this.getPropKey(prop, value)
      this.stylesMap.get(propKey) ?? this.setStyles(prop, value, propKey)
      return this.stylesMap.get(propKey)!
    }

    return this.isShorthand(prop) ? inner(this.resolveShorthand(prop), value) : inner(prop, value)
  }

  resolve(prop: string, value: string | undefined) {
    if (!value) return { className: '', styles: {} }
    return {
      className: this.getOrCreateClassName(prop, clean(value)),
      styles: this.getOrCreateStyle(prop, value),
    }
  }
}

export function mergeUtilities(utilities: UtilityConfig[] | undefined): UtilityConfig {
  return (utilities ?? []).reduce<UtilityConfig>(
    (acc, utility) => {
      acc.properties = { ...acc.properties, ...utility.properties }
      acc.shorthands = { ...acc.shorthands, ...utility.shorthands }
      return acc
    },
    { properties: {}, shorthands: {} },
  )
}
