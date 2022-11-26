import { compact, isFunction, isString, withoutSpace } from '@pandacss/shared'
import type { TokenDictionary } from '@pandacss/token-dictionary'
import type { AnyFunction, Dict, PropertyConfig, PropertyTransform, UtilityConfig } from '@pandacss/types'
import type { TransformResult } from './types'

export type UtilityOptions = {
  config?: UtilityConfig
  tokens: TokenDictionary
  separator?: string
}

export class Utility {
  /**
   * The token map or dictionary of tokens
   */
  tokens: TokenDictionary

  /**
   * The map of property names to their resolved class names
   */
  classNames: Map<string, string> = new Map()

  /**
   * The map of the property to their resolved styless
   */
  styles: Map<string, Dict> = new Map()

  /**
   * Map of shorthand properties to their longhand properties
   */
  shorthands = new Map<string, string>()

  /**
   * The map of possible values for each property
   */
  types: Map<string, Set<string>> = new Map()
  /**
   * The utility config
   */
  config: UtilityConfig = {}

  /**
   * Useful for reporting custom values
   */
  customValues: Map<string, string> = new Map()

  /**
   * The map of property names to their transform functions
   */
  private transforms: Map<string, PropertyTransform> = new Map()

  /**
   * The map of property names to their config
   */
  private configs: Map<string, PropertyConfig> = new Map()

  separator = '_'

  constructor(options: UtilityOptions) {
    const { tokens, config = {}, separator } = options

    this.tokens = tokens
    this.config = config
    if (separator) {
      this.separator = separator
    }

    this.assignShorthands()
    this.assignPaletteProperty()

    this.assignProperties()
    this.assignPropertyTypes()
  }

  register = (property: string, config: PropertyConfig) => {
    this.assignProperty(property, config)
    this.assignPropertyType(property, config)
    this.config[property] = config
  }

  private assignShorthands = () => {
    for (const [property, config] of Object.entries(this.config)) {
      const { shorthand } = this.normalize(config) ?? {}
      if (!shorthand) continue
      this.shorthands.set(shorthand, property)
    }
  }

  private assignPaletteProperty = () => {
    const values = this.tokens.palettes
    this.config.palette = {
      values: Object.keys(values),
      transform(value) {
        return values[value]
      },
    }
  }

  resolveShorthand = (prop: string) => {
    return this.shorthands.get(prop) ?? prop
  }

  public get hasShorthand() {
    return this.shorthands.size > 0
  }

  public get isEmpty() {
    return Object.keys(this.config).length === 0
  }

  public entries = () => {
    const value = Object.entries(this.config)
      .filter(([, value]) => !!value?.className)
      .map(([key, value]) => [key, value!.className])

    return value as [string, string][]
  }

  private getPropKey = (prop: string, value: string) => {
    return `(${prop} = ${value})`
  }

  private hash = (prop: string, value: string) => {
    // mb_40px, or mb=50px
    return `${prop}${this.separator}${value}`
  }

  /**
   * Get all the possible values for the defined property
   */
  private getPropertyValues = (config: PropertyConfig) => {
    const { values } = config

    if (isString(values)) {
      return this.tokens.getValue(values) ?? {}
    }

    if (Array.isArray(values)) {
      return values.reduce<Dict<string>>((result, value) => {
        result[value] = value
        return result
      }, {})
    }

    if (isFunction(values)) {
      return values(this.getToken.bind(this))
    }

    return values
  }

  getToken = (path: string) => {
    return this.tokens.get(path)
  }

  /**
   * Normalize the property config
   */
  normalize = (value: PropertyConfig | undefined): PropertyConfig | undefined => {
    return value
  }

  private assignProperty = (property: string, propertyConfig: PropertyConfig) => {
    const config = this.normalize(propertyConfig)
    this.setTransform(property, config?.transform)

    if (!config) return

    this.configs.set(property, config)
    const values = this.getPropertyValues(config)

    if (!values) return

    for (const [alias, raw] of Object.entries(values)) {
      const propKey = this.getPropKey(property, alias)
      this.setStyles(property, raw, propKey)
      this.setClassName(property, alias)
    }
  }

  private assignProperties = () => {
    for (const [property, propertyConfig] of Object.entries(this.config)) {
      if (!propertyConfig) continue
      this.assignProperty(property, propertyConfig)
    }
  }

  private assignPropertyType = (property: string, propertyConfig: PropertyConfig) => {
    const config = this.normalize(propertyConfig)

    if (!config) return

    const values = this.getPropertyValues(config)

    if (typeof values === 'object' && values.type) {
      this.types.set(property, new Set([`type:${values.type}`]))
      return
    }

    if (values) {
      this.types.set(property, new Set(Object.keys(values)))
    }

    const set = this.types.get(property) ?? new Set()

    if (config.property) {
      this.types.set(property, set.add(`CSSProperties["${config.property}"]`))
    }
  }

  private assignPropertyTypes = () => {
    for (const [property, propertyConfig] of Object.entries(this.config)) {
      if (!propertyConfig) continue
      this.assignPropertyType(property, propertyConfig)
    }
  }

  /**
   * Returns the Typescript type for the define properties
   */
  getTypes = () => {
    const map = new Map<string, string[]>()

    for (const [prop, tokens] of this.types.entries()) {
      // When tokens does not exist in the config
      if (tokens.size === 0) {
        map.set(prop, ['string'])
        continue
      }

      const typeValues = Array.from(tokens).map((key) => {
        if (key.startsWith('CSSProperties')) return key
        if (key.startsWith('type:')) return key.replace('type:', '')
        return JSON.stringify(key)
      })

      map.set(prop, typeValues)
    }

    return map
  }

  defaultTransform = (value: string, prop: string) => {
    const isCssVar = prop.startsWith('--')

    if (isCssVar) {
      const tokenValue = this.tokens.getTokenVar(value)
      value = typeof tokenValue === 'string' ? tokenValue : value
    }

    return { [prop]: value }
  }

  private setTransform = (property: string, transform?: AnyFunction) => {
    const defaultTransform = (value: string) => this.defaultTransform(value, property)

    const transformFn = transform ?? defaultTransform
    this.transforms.set(property, transformFn)

    return this
  }

  private setStyles = (property: string, raw: string, propKey?: string) => {
    propKey = propKey ?? this.getPropKey(property, raw)

    const defaultTransform = (value: string) => this.defaultTransform(value, property)
    const getStyles = this.transforms.get(property) ?? defaultTransform

    this.styles.set(propKey, getStyles(raw, this.getToken.bind(this)))

    return this
  }

  private setClassName = (property: string, raw: string) => {
    const propKey = this.getPropKey(property, raw)
    const config = this.configs.get(property)

    let className: string

    if (!config || !config.className) {
      className = this.hash(property, raw)
    } else {
      className = this.hash(config.className, raw)
    }

    this.classNames.set(propKey, className)

    return this
  }

  /**
   * Whether a given property exists in the config
   */
  private isProperty = (prop: string) => {
    return this.configs.has(prop)
  }

  /**
   * Returns the resolved className for a given property and value
   */
  private getOrCreateClassName = (prop: string, value: string) => {
    const inner = (prop: string, value: string) => {
      const propKey = this.getPropKey(prop, value)

      if (!this.classNames.has(propKey)) {
        //
        if (this.isProperty(prop)) {
          this.customValues.set(prop, value)
        }

        this.setClassName(prop, value)
      }

      return this.classNames.get(propKey)!
    }

    return inner(prop, value)
  }

  /**
   * Get or create the resolved styles for a given property and value
   */
  private getOrCreateStyle = (prop: string, value: string) => {
    const propKey = this.getPropKey(prop, value)
    this.styles.get(propKey) ?? this.setStyles(prop, value, propKey)
    return this.styles.get(propKey)!
  }

  /**
   * Returns the resolved className and styles for a given property and value
   */
  transform = (prop: string, value: string | undefined): TransformResult => {
    if (value == null) {
      return { className: '', styles: {} }
    }
    const key = this.resolveShorthand(prop)
    return compact({
      layer: this.configs.get(key)?.layer,
      className: this.getOrCreateClassName(key, withoutSpace(value)),
      styles: this.getOrCreateStyle(key, value),
    })
  }

  /**
   * All keys including shorthand keys
   */
  keys = () => {
    const shorthands = Array.from(this.shorthands.keys())
    const properties = Object.keys(this.config)
    return [...shorthands, ...properties]
  }
}
