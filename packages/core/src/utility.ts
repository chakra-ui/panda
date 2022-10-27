import {
  isFunction,
  isImportant,
  isObject,
  isString,
  walkObject,
  withoutImportant,
  withoutSpace,
} from '@css-panda/shared'
import type { TokenDictionary } from '@css-panda/token-dictionary'
import type { AnyFunction, Dict, LayerStyles, PropertyConfig, TextStyles, UtilityConfig } from '@css-panda/types'
import merge from 'lodash.merge'
import { cssToJs, toCss } from './to-css'

type Options = {
  config?: UtilityConfig
  compositions?: {
    textStyle?: TextStyles
    layerStyle?: LayerStyles
  }
  tokens: TokenDictionary
}

export class Utility {
  /**
   * The token map or dictionary of tokens
   */
  tokenMap: TokenDictionary

  /**
   * The map of property names to their resolved class names
   */
  classNameMap: Map<string, string> = new Map()

  /**
   * The map of the property to their resolved styless
   */
  stylesMap: Map<string, Dict> = new Map()

  /**
   * Map of shorthand properties to their longhand properties
   */
  shorthandMap = new Map<string, string>()

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

  constructor(private options: Options) {
    const { tokens, config = {} } = options
    this.tokenMap = tokens

    this.config = config
    this.assignShorthands()
    this.assignCompositions()
    this.assignPaletteProperty()

    this.assignProperties()
    this.assignValueMap()
  }

  private assignShorthands() {
    for (const [property, config] of Object.entries(this.config)) {
      const { shorthand } = this.normalize(config) ?? {}
      if (!shorthand) continue
      this.shorthandMap.set(shorthand, property)
    }
  }

  private assignPaletteProperty() {
    const values = this.tokenMap.palettes
    this.config.palette = {
      values: Object.keys(values),
      transform(value) {
        return values[value]
      },
    }
  }

  resolveShorthand = (prop: string) => {
    const shorthand = this.shorthandMap.get(prop)
    return shorthand ?? prop
  }

  public get hasShorthand() {
    return this.shorthandMap.size > 0
  }

  public get isEmpty() {
    return Object.keys(this.config).length === 0
  }

  public entries() {
    const value = Object.entries(this.config)
      .filter(([, value]) => !!value?.className)
      .map(([key, value]) => [key, value!.className])

    return value as [string, string][]
  }

  private assignCompositions() {
    const compositions = this.options.compositions ?? {}

    for (const [key, values] of Object.entries(compositions)) {
      if (!values || this.config[key]) continue

      const flattened = flattenComposition(values)

      const config: PropertyConfig = {
        className: key,
        values: Object.keys(flattened),
        transform: (value) => {
          return getCompositionStyles(flattened[value], (prop, value) => {
            return this.resolve(prop, value)
          })
        },
      }

      Object.assign(this.config, { [key]: config })
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
      return this.tokenMap.getValue(values) ?? {}
    }

    if (Array.isArray(values)) {
      return values.reduce<Dict<string>>((result, value) => {
        result[value] = value
        return result
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
  normalize(value: PropertyConfig | undefined): PropertyConfig | undefined {
    return value
  }

  private assignProperties() {
    for (const [property, propertyConfig] of Object.entries(this.config)) {
      const config = this.normalize(propertyConfig)

      this.setTransform(property, config?.transform)

      if (!config) continue

      const category = typeof config.values === 'string' ? config.values : undefined
      this.propertyConfigMap.set(property, { ...config, category })

      const values = this.getPropertyValues(config)

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
      const config = this.normalize(propertyConfig)

      if (!config) continue

      const values = this.getPropertyValues(config)

      if (typeof values === 'object' && values.type) {
        this.valuesMap.set(property, new Set([`type:${values.type}`]))
        continue
      }

      if (values) {
        this.valuesMap.set(property, new Set(Object.keys(values)))
      }

      const set = this.valuesMap.get(property) ?? new Set()

      if (config.property) {
        this.valuesMap.set(property, set.add(`CSSProperties["${config.property}"]`))
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
    const isCssVar = prop.startsWith('--')

    if (isCssVar) {
      const tokenValue = this.tokenMap.getTokenVar(value)
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

    let className: string

    if (!config || !config.className) {
      className = this.hash(property, raw)
    } else {
      className = this.hash(config.className, raw)
    }

    this.classNameMap.set(propKey, className)

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
        //
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
    if (value == null) {
      return { className: '', styles: {} }
    }
    const key = this.resolveShorthand(prop)
    return {
      className: this.getOrCreateClassName(key, withoutSpace(value)),
      styles: this.getOrCreateStyle(key, value),
    }
  }

  keys() {
    const shorthands = Array.from(this.shorthandMap.keys())
    const properties = Object.keys(this.config)
    return [...shorthands, ...properties]
  }
}

function flattenComposition(values: TextStyles | LayerStyles) {
  const result: Dict = {}

  walkObject(
    values,
    (token, paths) => {
      result[paths.join('.')] = token.value
    },
    {
      stop(v) {
        return isObject(v) && 'value' in v
      },
    },
  )

  return result
}

function getCompositionStyles(styles: Dict, fn: AnyFunction) {
  const result: Dict = {}

  walkObject(styles, (value, paths) => {
    const [prop] = paths

    let { styles } = fn(prop, withoutImportant(value))
    const cssRoot = toCss(styles, { important: isImportant(value) })

    styles = cssToJs(cssRoot.root.toString())
    merge(result, styles)
  })

  return result
}
