import {
  compact,
  getArbitraryValue,
  hypenateProperty,
  isFunction,
  isString,
  mapToJson,
  memo,
  toHash,
  withoutSpace,
} from '@pandacss/shared'
import type { TokenDictionary } from '@pandacss/token-dictionary'
import type {
  AnyFunction,
  Config,
  Dict,
  PropertyConfig,
  PropertyTransform,
  TransformArgs,
  UtilityConfig,
} from '@pandacss/types'
import type { TransformResult } from './types'
import { colorMix } from './color-mix'

export interface UtilityOptions extends Pick<Config, 'shorthands' | 'strictTokens'> {
  config?: UtilityConfig
  tokens: TokenDictionary
  separator?: string
  prefix?: string
  shorthands?: boolean
  strictTokens?: Config['strictTokens']
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
   * The map of the property keys
   */
  propertyTypeKeys: Map<string, Set<string>> = new Map()

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

  /**
   * The map of deprecated properties
   */
  private deprecated: Set<string> = new Set()

  separator = '_'

  prefix = ''

  strictTokens: Config['strictTokens'] = false

  constructor(options: UtilityOptions) {
    const { tokens, config = {}, separator, prefix, shorthands, strictTokens } = options

    this.tokens = tokens
    this.config = this.normalizeConfig(config)

    if (separator) {
      this.separator = separator
    }

    if (prefix) {
      this.prefix = prefix
    }

    if (strictTokens) {
      this.strictTokens = strictTokens
    }

    if (shorthands) {
      this.assignShorthands()
    }

    this.assignColorPaletteProperty()

    this.assignProperties()
    this.assignPropertyTypes()
  }

  defaultHashFn = toHash

  toHash = (path: string[], hashFn: (str: string) => string): string => hashFn(path.join(':'))

  private normalizeConfig(config: UtilityConfig) {
    return Object.fromEntries(
      Object.entries(config).map(([property, propertyConfig]) => {
        return [property, this.normalize(propertyConfig)]
      }),
    )
  }

  private assignDeprecated = (property: string, config: PropertyConfig) => {
    if (!config.deprecated) return
    this.deprecated.add(property)
    if (isString(config.shorthand)) this.deprecated.add(config.shorthand)
    if (Array.isArray(config.shorthand)) {
      config.shorthand.forEach((shorthand) => this.deprecated.add(shorthand))
    }
  }

  register = (property: string, config: PropertyConfig) => {
    this.config[property] = this.normalize(config)
    this.assignProperty(property, config)
    this.assignPropertyType(property, config)
  }

  private assignShorthands = () => {
    for (const [property, config] of Object.entries(this.config)) {
      const { shorthand } = config ?? {}

      if (!shorthand) continue

      const values = Array.isArray(shorthand) ? shorthand : [shorthand]
      values.forEach((shorthandName) => {
        this.shorthands.set(shorthandName, property)
      })
    }
  }

  private assignColorPaletteProperty = () => {
    if (!this.tokens.view.colorPalettes.size) return

    const values = mapToJson(this.tokens.view.colorPalettes) as Record<string, any>
    this.config.colorPalette = {
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
  public getPropertyValues = (config: PropertyConfig, resolveFn?: (key: string) => string) => {
    const { values } = config

    // convert `theme('spacing') => Tokens["spacing"]` to avoid too much type values
    const fn = (key: string) => {
      // skip empty values
      const categoryValues = this.getTokenCategoryValues(key)
      if (!categoryValues) return

      const prop = resolveFn?.(key)
      if (!prop) return

      return { [prop]: categoryValues }
    }

    if (isString(values)) {
      return fn?.(values) ?? this.tokens.view.getCategoryValues(values) ?? {}
    }

    if (Array.isArray(values)) {
      return values.reduce<Dict<string>>((result, value) => {
        result[value] = value
        return result
      }, {})
    }

    if (isFunction(values)) {
      return values(resolveFn ? fn : this.getTokenCategoryValues.bind(this))
    }

    return values
  }

  getToken = (path: string) => {
    return this.tokens.view.get(path)
  }

  getTokenCategoryValues = (category: string) => {
    return this.tokens.view.getCategoryValues(category)
  }

  /**
   * Normalize the property config
   */
  normalize = (value: PropertyConfig | undefined): PropertyConfig | undefined => {
    const config = { ...value }

    // set graceful defaults for className
    if (config.shorthand && !config.className) {
      config.className = Array.isArray(config.shorthand) ? config.shorthand[0] : config.shorthand
    }

    return config
  }

  private assignProperty = (property: string, config: PropertyConfig) => {
    this.setTransform(property, config?.transform)
    this.assignDeprecated(property, config)

    if (!config) return

    this.configs.set(property, config)
    const values = this.getPropertyValues(config)

    if (!values) return

    for (const [alias, raw] of Object.entries(values)) {
      const propKey = this.getPropKey(property, alias)
      this.setStyles(property, raw, alias, propKey)
      this.setClassName(property, alias)
    }
  }

  private assignProperties = () => {
    for (const [property, propertyConfig] of Object.entries(this.config)) {
      if (!propertyConfig) continue
      this.assignProperty(property, propertyConfig)
    }
  }

  getPropertyKeys = (prop: string) => {
    const propConfig = this.config[prop]
    if (!propConfig) return []

    const values = this.getPropertyValues(propConfig)
    if (!values) return []

    return Object.keys(values)
  }

  getPropertyTypeKeys = (property: string) => {
    const keys = this.propertyTypeKeys.get(property)
    return keys ? Array.from(keys) : []
  }

  private assignPropertyType = (property: string, config: PropertyConfig | undefined) => {
    if (!config) return

    const values = this.getPropertyValues(config, (key) => `type:Tokens["${key}"]`)

    if (typeof values === 'object' && values.type) {
      this.types.set(property, new Set([`type:${values.type}`]))
      return
    }

    if (values) {
      const keys = new Set(Object.keys(values))
      this.types.set(property, keys)
      this.propertyTypeKeys.set(property, keys)
    }

    const set = this.types.get(property) ?? new Set()

    if (!this.strictTokens && config.property) {
      this.types.set(property, set.add(`CssProperties["${config.property}"]`))
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
        continue
      }

      const typeValues = Array.from(tokens).map((key) => {
        if (key.startsWith('CssProperties')) return key
        if (key.startsWith('type:')) return key.replace('type:', '')
        return JSON.stringify(key)
      })

      map.set(prop, typeValues)
    }

    return map
  }

  defaultTransform = memo((value: string, prop: string) => {
    const isCssVar = prop.startsWith('--')

    if (isCssVar) {
      const tokenValue = this.tokens.view.get(value)
      value = typeof tokenValue === 'string' ? tokenValue : value
    }

    return { [prop]: value }
  })

  private setTransform = (property: string, transform?: AnyFunction) => {
    const defaultTransform = (value: string) => this.defaultTransform(value, property)

    const transformFn = transform ?? defaultTransform
    this.transforms.set(property, transformFn)

    return this
  }

  private getTransformArgs = (raw: string): TransformArgs => {
    const token = Object.assign(this.getToken.bind(this), {
      raw: (path: string) => this.tokens.getByName(path),
    })

    const _colorMix = (value: string) => colorMix(value, token)

    return {
      token,
      raw,
      utils: { colorMix: _colorMix },
    }
  }

  private setStyles = (property: string, raw: string, alias: string, propKey?: string) => {
    propKey = propKey ?? this.getPropKey(property, raw)

    const defaultTransform = (value: string) => this.defaultTransform(value, property)
    const getStyles = this.transforms.get(property) ?? defaultTransform
    const styles = getStyles(raw, this.getTransformArgs(alias))

    this.styles.set(propKey, styles ?? {})

    return this
  }

  formatClassName = (className: string) => {
    return [this.prefix, className].filter(Boolean).join('-')
  }

  private setClassName = (property: string, raw: string) => {
    const propKey = this.getPropKey(property, raw)
    const config = this.configs.get(property)

    let className: string

    if (!config || !config.className) {
      className = this.hash(hypenateProperty(property), raw)
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
    this.styles.get(propKey) ?? this.setStyles(prop, value, value, propKey)
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

    let styleValue = getArbitraryValue(value)
    if (isString(styleValue)) {
      styleValue = this.tokens.expandReferenceInValue(styleValue)
    }

    return compact({
      layer: this.configs.get(key)?.layer,
      className: this.getOrCreateClassName(key, withoutSpace(value)),
      styles: this.getOrCreateStyle(key, styleValue),
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

  /**
   * Returns a map of the property keys and their shorthands
   */
  getPropShorthandsMap = () => {
    const shorthandsByProp = new Map<string, string[]>()

    this.shorthands.forEach((prop, shorthand) => {
      const list = shorthandsByProp.get(prop) ?? []
      list.push(shorthand)
      shorthandsByProp.set(prop, list)
    })

    return shorthandsByProp
  }

  /**
   * Returns the shorthands for a given property
   */
  getPropShorthands = (prop: string) => {
    return this.getPropShorthandsMap().get(prop) ?? []
  }

  /**
   * Whether a given property is deprecated
   */
  isDeprecated = (prop: string) => {
    return this.deprecated.has(prop)
  }
}
