import { mergeAndConcat } from 'merge-anything'
import { bundle } from './bundle'
import { assign, mergeWith } from './utils'
import type { Config } from '@pandacss/types'

type Extendable<T> = T & { extend?: T }
type Dict = Record<string, any>
type ExtendableRecord = Extendable<Dict>
type ExtendableConfig = Extendable<Config>

/**
 * Collect all `extend` properties into an array (to avoid mutation)
 */
function getExtends(items: ExtendableRecord[]) {
  return items.reduce((merged, { extend }) => {
    return mergeWith(merged, extend, (originalValue: any, newValue: any) => {
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

/**
 * Merge all configs into a single config
 */
export function mergeConfigs(configs: ExtendableConfig[]) {
  return assign(
    {
      conditions: mergeExtensions(configs.map((config) => config.conditions ?? {})),
      theme: mergeExtensions(configs.map((config) => config.theme ?? {})),
      patterns: mergeExtensions(configs.map((config) => config.patterns ?? {})),
      utilities: mergeExtensions(configs.map((config) => config.utilities ?? {})),
      globalCss: mergeExtensions(configs.map((config) => config.globalCss ?? {})),
    },
    ...configs,
  )
}

/**
 * Recursively merge all presets into a single config
 */
export async function getResolvedConfig(config: ExtendableConfig, cwd: string) {
  const presets = config.presets ?? []

  const configs: ExtendableConfig[] = [config]
  while (presets.length > 0) {
    const preset = await presets.shift()!
    if (typeof preset === 'string') {
      const presetModule = await bundle(preset, cwd)
      configs.push(await presetModule.config)
      presets.unshift(...((await presetModule.config.presets) ?? []))
    } else {
      configs.push(preset)
      presets.unshift(...(preset.presets ?? []))
    }
  }

  return mergeConfigs(configs) as Config
}
