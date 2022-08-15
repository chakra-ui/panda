import { Dictionary } from '@css-panda/dictionary'
import { Dict } from '@css-panda/types'
import { UtilityConfig, PropertyUtility } from './types'

const isString = (v: any): v is string => typeof v === 'string'
const isFunction = (v: any): v is Function => typeof v === 'function'

export class CSSUtility {
  dictionary: Dictionary

  classNameMap: Map<string, string> = new Map()
  stylesMap: Map<string, Dict> = new Map()

  config: UtilityConfig<Dict>
  report: Map<string, string> = new Map()

  private transformMap: Map<string, Function> = new Map()
  private propertyConfigMap: Map<string, PropertyUtility<any>> = new Map()

  private getPropKey(prop: string, value: string) {
    return `(${prop} = ${value})`
  }

  private hash(prop: string, value: string) {
    return `${prop}_${value}`
  }

  private getPropertyValues({ values }: PropertyUtility<any>): Dict<string> {
    if (isString(values)) {
      return this.dictionary.flattenedTokens.get(values) ?? {}
    }

    if (Array.isArray(values)) {
      return values.reduce<Dict<string>>((acc, v) => {
        acc[v] = v
        return acc
      }, {})
    }

    if (isFunction(values)) {
      return values((path) => this.dictionary.query(path))
    }

    return values as Dict<string>
  }

  constructor(options: { config?: UtilityConfig<Dict>; tokens: Dictionary }) {
    const { tokens, config } = options
    this.dictionary = tokens

    if (config) {
      this.config = config
      this.assignProperties()
    }
  }

  private assignProperties() {
    for (const [property, propertyConfig] of Object.entries(this.config.properties)) {
      this.setTransform(property, propertyConfig?.transform)

      if (!propertyConfig) continue
      this.propertyConfigMap.set(property, propertyConfig)

      const values = this.getPropertyValues(propertyConfig)
      if (!values) continue

      for (const [alias, raw] of Object.entries(values)) {
        const propKey = this.getPropKey(property, alias)
        this.setStyles(property, raw, propKey)
        this.setClassName(property, alias)
      }
    }
  }

  private setTransform(property: string, transform?: Function) {
    const defaultTransform = (value: string) => ({ [property]: value })
    const transformFn = transform ?? defaultTransform
    this.transformMap.set(property, transformFn)
    return this
  }

  private setStyles(property: string, raw: string, propKey?: string) {
    propKey = propKey ?? this.getPropKey(property, raw)
    const defaultTransform = (value: string) => ({ [property]: value })
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

  resolve(prop: string, value: string) {
    return {
      className: this.getOrCreateClassName(prop, value),
      styles: this.getOrCreateStyle(prop, value),
    }
  }
}

export function mergeUtilities(utilities: CSSUtility[]) {
  const dictionary = utilities[0].dictionary

  const config = utilities.reduce((acc, utility) => {
    return { ...acc, ...utility.config }
  }, {} as UtilityConfig<Dict>)

  return new CSSUtility({ tokens: dictionary, config })
}
