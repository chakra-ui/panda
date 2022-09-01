import type { Dictionary } from '@css-panda/dictionary'
import type { Dict, Utility, PropertyUtility } from '@css-panda/types'

const isString = (v: any): v is string => typeof v === 'string'
const isFunction = (v: any): v is Function => typeof v === 'function'
const clean = (v: string) => v.toString().replaceAll(' ', '_')

export class CSSUtility {
  dictionary: Dictionary

  classNameMap: Map<string, string> = new Map()
  stylesMap: Map<string, Dict> = new Map()
  valuesMap: Map<string, Set<string>> = new Map()

  config: Utility<Dict> = { properties: {} }
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

  constructor(options: { config?: Utility<Dict>; tokens: Dictionary }) {
    const { tokens, config } = options
    this.dictionary = tokens

    if (config) {
      this.config = config
      this.assignProperties()
      this.assignValueMap()
    }
  }

  normalize(value: string | PropertyUtility<any> | undefined): PropertyUtility<any> | undefined {
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

      if (values) {
        this.valuesMap.set(property, new Set(Object.keys(values)))
      }

      const set = this.valuesMap.get(property) ?? new Set()

      if (propConfig.cssType) {
        this.valuesMap.set(property, set.add(`CSSProperties["${propConfig.cssType}"]`))
        continue
      }

      if (propConfig.valueType) {
        this.valuesMap.set(property, new Set([`__type__${propConfig.valueType}`]))
      }
    }

    for (const [shorthand, longhand] of Object.entries(this.config.shorthands || {})) {
      this.valuesMap.set(shorthand, this.valuesMap.get(longhand)!)
    }
  }

  defaultTransform = (value: string, prop: string) => {
    const isCssVariable = prop.startsWith('--')
    if (isCssVariable) {
      const tokenValue = this.dictionary.values.get(value)?.varRef
      value = typeof tokenValue === 'string' ? tokenValue : value
    }
    return { [prop]: value }
  }

  private setTransform(property: string, transform?: Function) {
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

  resolve(prop: string, value: string) {
    return {
      className: this.getOrCreateClassName(prop, clean(value)),
      styles: this.getOrCreateStyle(prop, value),
    }
  }
}

export function mergeUtilities(utilities: Utility[] | undefined): Utility {
  return (utilities ?? []).reduce<Utility>(
    (acc, utility) => {
      acc.properties = { ...acc.properties, ...utility.properties }
      acc.shorthands = { ...acc.shorthands, ...utility.shorthands }
      return acc
    },
    { properties: {}, shorthands: {} },
  )
}
