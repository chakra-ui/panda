import { PANDA_CONFIG_NAME, assign, mergeWith, walkObject } from '@pandacss/shared'
import type { Config, UserConfig } from '@pandacss/types'
import { mergeAndConcat } from 'merge-anything'
import { mergeHooks } from './merge-hooks'
import { isValidToken } from './validation/utils'

type Extendable<T> = T & { extend?: T }
interface Dict {
  [key: string]: any
}
type ExtendableRecord = Extendable<Dict>
type ExtendableConfig = Extendable<Config>

/**
 * Collect all `extend` properties into an array (to avoid mutation)
 */
function getExtends(items: ExtendableRecord[]) {
  return items.reduce((merged, { extend }) => {
    if (!extend) return merged

    return mergeWith(merged, extend, (originalValue: any, newValue: any) => {
      if (newValue === undefined) {
        return originalValue ?? []
      }

      if (originalValue === undefined) {
        return [newValue]
      }

      if (Array.isArray(originalValue)) {
        return [newValue, ...originalValue]
      }

      return [newValue, originalValue]
    })
  }, {})
}

/**
 * Separate the `extend` properties from the rest of the object
 */
function mergeRecords(records: ExtendableRecord[]) {
  return {
    ...records.reduce((acc, record) => assign(acc, record), {}),
    extend: getExtends(records),
  }
}

/**
 * Merge all `extend` properties into the rest of the object
 */
function mergeExtensions(records: ExtendableRecord[]) {
  const { extend = [], ...restProps } = mergeRecords(records)
  return mergeWith(restProps, extend, (obj: any, extensions: any[]) => {
    return mergeAndConcat({}, obj, ...extensions)
  })
}

const isEmptyObject = (obj: any) => typeof obj === 'object' && Object.keys(obj).length === 0

const compact = (obj: any) => {
  return Object.keys(obj).reduce((acc, key) => {
    if (obj[key] !== undefined && !isEmptyObject(obj[key])) {
      acc[key] = obj[key]
    }
    return acc
  }, {} as any)
}

const tokenKeys = ['description', 'extensions', 'type', 'value', 'deprecated']

/**
 * Merge all configs into a single config
 */
export function mergeConfigs(configs: ExtendableConfig[]): UserConfig {
  const [userConfig] = configs
  const pluginHooks = userConfig.plugins ?? []
  if (userConfig.hooks) {
    pluginHooks.push({ name: PANDA_CONFIG_NAME, hooks: userConfig.hooks })
  }

  const mergedResult = assign(
    {
      conditions: mergeExtensions(configs.map((config) => config.conditions ?? {})),
      theme: mergeExtensions(configs.map((config) => config.theme ?? {})),
      patterns: mergeExtensions(configs.map((config) => config.patterns ?? {})),
      utilities: mergeExtensions(configs.map((config) => config.utilities ?? {})),
      globalCss: mergeExtensions(configs.map((config) => config.globalCss ?? {})),
      globalVars: mergeExtensions(configs.map((config) => config.globalVars ?? {})),
      globalFontface: mergeExtensions(configs.map((config) => config.globalFontface ?? {})),
      staticCss: mergeExtensions(configs.map((config) => config.staticCss ?? {})),
      themes: mergeExtensions(configs.map((config) => config.themes ?? {})),
      hooks: mergeHooks(pluginHooks),
    },
    ...configs,
  )

  const withoutEmpty = compact(mergedResult)

  /**
   * Properly merge tokens between flat/nested forms by setting the flat form as the default
   * preset:
   * ```
   * tokens: {
   *   black: {
   *     value: "black"
   *   }
   * }
   * // color: "black"
   * ```
   *
   * config:
   * ```
   * tokens: {
   *   black: {
   *     0: { value: "black" },
   *     10: { value: "black/10" },
   *     20: { value: "black/20" },
   *     // ...
   *   }
   * }
   *
   * // color: "black.20"
   * ```
   */
  if (withoutEmpty.theme?.tokens) {
    walkObject(withoutEmpty.theme.tokens, (args) => args, {
      stop(token) {
        if (!isValidToken(token)) return false

        const keys = Object.keys(token)
        const nestedKeys = keys.filter((k) => !tokenKeys.includes(k))
        const nested = nestedKeys.length > 0

        if (nested) {
          token.DEFAULT ||= {}
          tokenKeys.forEach((key) => {
            if (token[key] == null) return
            token.DEFAULT[key] ||= token[key]
            delete token[key]
          })
        }

        return true
      },
    })
  }

  return withoutEmpty
}
