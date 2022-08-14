import { CSSUtility } from './types'
import { Dictionary } from '@css-panda/dictionary'

const isString = (v: any): v is string => typeof v === 'string'
const isFunction = (v: any): v is Function => typeof v === 'function'

export class CSSUtilityMap {
  properties = new Set<string>()
  propertyMap = new Map<
    string,
    {
      className: string
      styles: Record<string, any>
    }
  >()

  getPropKey(prop: string, value: string) {
    return `${prop}_${value}`
  }

  constructor(values: CSSUtility<Record<string, any>>, private dictionary: Dictionary) {
    //
    for (const [property, config] of Object.entries(values.properties)) {
      //
      if (!config) continue

      const tokenEntries = isString(config.values)
        ? dictionary.flattenedTokens.get(config.values)
        : isFunction(config.values)
        ? config.values((path) => dictionary.query(path))
        : config.values

      if (!tokenEntries) continue

      for (const [value, propValue] of Object.entries(tokenEntries)) {
        const styles = isString(propValue) ? { [property]: propValue } : propValue
        const propKey = this.getPropKey(property, value)

        this.properties.add(propKey)
        this.propertyMap.set(propKey, {
          className: isString(config.className) ? `${config.className}-${value}` : config.className(value, property),
          styles,
        })
      }
    }
  }

  hasProperty(prop: string, value: string) {
    return this.propertyMap.has(this.getPropKey(prop, value))
  }

  getProperty(prop: string, value: string) {
    return this.propertyMap.get(this.getPropKey(prop, value))
  }
}
