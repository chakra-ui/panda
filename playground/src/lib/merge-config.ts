import type { Config, Preset } from '@pandacss/types'
import { mergeAndConcat } from 'merge-anything'

type Extendable<T> = T & { extend?: T }
type Dict = Record<string, any>
type ExtendableRecord = Extendable<Dict>
type ExtendableConfig = Extendable<Config>

/**
 * Recursively merge all presets into a single config
 */
export function getResolvedConfig(config: ExtendableConfig) {
  const presets = config.presets ?? []

  const configs: ExtendableConfig[] = [config]
  while (presets.length > 0) {
    const preset = presets.shift()!

    if (!isPlaygroundPreset(preset)) {
      console.error(`Invalid preset: ${preset}`)
      return
    }

    if (preset instanceof Promise) {
      preset.then((result) => {
        configs.push(result)
        presets.unshift(...(result.presets ?? []))
      })
    } else {
      configs.push(preset)
      presets.unshift(...(preset.presets ?? []))
    }
  }

  return mergeConfigs(configs) as Config
}

function isPlaygroundPreset(preset: string | Preset | Promise<Preset>): preset is Preset | Promise<Preset> {
  return typeof preset !== 'string'
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
    },
    ...configs,
  )

  return compact(mergedResult)
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

export function mergeWith(target: any, ...sources: any[]) {
  const customizer = sources.pop()

  for (const source of sources) {
    for (const key in source) {
      const merged = customizer(target[key], source[key])

      if (merged === undefined) {
        if (isObject(target[key]) && isObject(source[key])) {
          target[key] = mergeWith({}, target[key], source[key], customizer)
        } else {
          target[key] = source[key]
        }
      } else {
        target[key] = merged
      }
    }
  }

  return target
}

const isObject = (value: any) => {
  return Object.prototype.toString.call(value) === '[object Object]'
}

export function assign(target: any, ...sources: any[]) {
  for (const source of sources) {
    for (const key in source) {
      if (!target?.hasOwnProperty?.(key)) {
        target[key] = source[key]
      }
    }
  }

  return target
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
