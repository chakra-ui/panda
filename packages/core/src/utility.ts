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
  /**
   * The token map or dictionary of tokens
   */
  tokenMap: TokenMap

  /**
   * The map of property names to their resolved class names
   */
  classNameMap: Map<string, string> = new Map()

  /**
   * The map of the property to their resolved styless
   */
  stylesMap: Map<string, Dict> = new Map()

  /**
   * The map of possible values for each property
   */
  valuesMap: Map<string, Set<string>> = new Map()

  /**
   * The utility config
   */
  config: UtilityConfig = {}

  /**
   * Useful for reporting custom values
   */
  customValueMap: Map<string, string> = new Map()

  /**
   * The map of property names to their transform functions
   */
  private transformMap: Map<string, AnyFunction> = new Map()

  /**
   * The map of property names to their config
   */
  private propertyConfigMap: Map<string, PropertyConfig & { category: string | undefined }> = new Map()

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

  /**
   * Get all the possible values for the defined property
   */
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
      return values((path) => this.tokenMap.get(path))
    }

    return values
  }

  /**
   * Normalize the property config
   */
  normalize(value: string | PropertyConfig | undefined): PropertyConfig | undefined {
    return typeof value === 'string' ? { className: value } : value
  }

  private assignProperties() {
    for (const [property, propertyConfig] of Object.entries(this.config)) {
      const propConfig = this.normalize(propertyConfig)

      this.setTransform(property, propConfig?.transform)

      if (!propConfig) continue
      const category = typeof propConfig.values === 'string' ? propConfig.values : undefined
      this.propertyConfigMap.set(property, { ...propConfig, category })

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
    for (const [property, propertyConfig] of Object.entries(this.config)) {
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
  }

  /**
   * Returns the Typescript type for the define properties
   */
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

  private isProperty(prop: string) {
    return this.propertyConfigMap.has(prop)
  }

  /**
   * Returns the resolved className for a given property and value
   */
  private getOrCreateClassName(prop: string, value: string) {
    const inner = (prop: string, value: string) => {
      const propKey = this.getPropKey(prop, value)
      if (!this.classNameMap.has(propKey)) {
        if (this.isProperty(prop)) {
          this.customValueMap.set(prop, value)
        }
        this.setClassName(prop, value)
      }
      return this.classNameMap.get(propKey)!
    }

    return inner(prop, value)
  }

  /**
   * Get or create the resolved styles for a given property and value
   */
  private getOrCreateStyle(prop: string, value: string) {
    const inner = (prop: string, value: string) => {
      const propKey = this.getPropKey(prop, value)
      this.stylesMap.get(propKey) ?? this.setStyles(prop, value, propKey)
      return this.stylesMap.get(propKey)!
    }

    return inner(prop, value)
  }

  /**
   * Returns the resolved className and styles for a given property and value
   */
  resolve(prop: string, value: string | undefined) {
    if (!value) return { className: '', styles: {} }
    return {
      className: this.getOrCreateClassName(prop, clean(value)),
      styles: this.getOrCreateStyle(prop, value),
    }
  }

  /**
   * Given a property and a value, return its raw details (category, raw, value)
   */
  getRawData(prop: string, value: string) {
    const propConfig = this.propertyConfigMap.get(prop)
    if (!propConfig) return

    const category = propConfig.category
    const values = this.getPropertyValues(this.normalize(propConfig)!)

    let raw = values?.[value] ?? value

    if (category) {
      raw = this.tokenMap.categoryMap.get(category)?.get(value)?.value ?? raw
    }

    return { category, raw, value }
  }

  keys() {
    return Object.keys(this.config)
  }
}
