import type { Config } from '@pandacss/types'
import { mergeAndConcat } from 'merge-anything'
import { assign, mergeWith } from './utils'
import { traverse } from '@pandacss/shared'

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
  omitKeysWithNullValue(records)

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

function omitKeysWithNullValue(configs: ExtendableConfig[]) {
  const omitPaths = new Set<string>()

  // First iteration to collect all paths with `null` values
  traverse(configs[0], (args) => {
    if (args.value === null && args.parent && args.key) {
      omitPaths.add(args.path)
      delete args.parent[args.key as keyof typeof args.parent]
    }
  })

  // Second iteration to remove all paths with `null` values in every config/presets
  configs.slice(1).forEach((config) => {
    traverse(config, (args) => {
      if (omitPaths.has(args.path)) {
        delete args.parent[args.key as keyof typeof args.parent]
      }
    })
  })
}

/**
 * Merge all configs into a single config
 */
export function mergeConfigs(configs: ExtendableConfig[]) {
  const mergedResult = assign(
    {
      conditions: mergeExtensions(configs.map((config) => config.conditions ?? {})),
      theme: mergeExtensions(configs.map((config) => config.theme ?? {})),
      patterns: mergeExtensions(configs.map((config) => config.patterns ?? {})),
      utilities: mergeExtensions(configs.map((config) => config.utilities ?? {})),
      globalCss: mergeExtensions(configs.map((config) => config.globalCss ?? {})),
      staticCss: mergeExtensions(configs.map((config) => config.staticCss ?? {})),
    },
    ...configs,
  )

  return compact(mergedResult)
}
