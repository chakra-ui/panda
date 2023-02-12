import { mergeAndConcat } from 'merge-anything'
import { bundleAndRequire } from './bundle-require'
import { assign, mergeWith } from './utils'

type Extendable<T> = T & { extend?: T }
type Dict = Record<string, any>
type ExtendableRecord = Extendable<Dict>

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
export function mergeConfigs(configs: ExtendableRecord[]) {
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
export async function getResolvedConfig(config: ExtendableRecord, cwd: string) {
  const presets = config.presets ?? []

  const configs: any[] = await Promise.all(
    presets
      .slice()
      .reverse()
      .map(async (preset: any) => {
        if (typeof preset === 'string') {
          const presetModule = await bundleAndRequire(preset, cwd)
          return getResolvedConfig(presetModule.config, cwd)
        } else {
          return getResolvedConfig(preset, cwd)
        }
      }),
  )

  delete config.presets

  return mergeConfigs([config, ...configs])
}
